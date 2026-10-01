import {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { db, auth, OperationType, handleFirestoreError } from '../firebase';
import { Product, StoreMerchant, User, DeliveryRide, DeliveryDriver, Order, AuditLog } from '../types';

/**
 * Emite evento global informando que a sessão expirou para que a aplicação
 * exiba o toast padrão e redirecione para o fluxo de autenticação.
 */
export function notifySessionExpired(message?: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('app:session-expired', {
        detail: { message: message || 'Sua sessão expirou. Faça login novamente para continuar.' }
      })
    );
  }
}

/**
 * Aguarda explicitamente a inicialização do Firebase Auth (onAuthStateChanged)
 * e valida o token de sessão do usuário antes de disparar leituras ou sincronizações.
 */
export async function ensureAuthenticatedUser(): Promise<FirebaseUser | null> {
  let currentUser = auth.currentUser;

  // Se o Firebase Auth ainda estiver carregando, aguarda a inicialização explícita
  if (!currentUser) {
    if (typeof auth.authStateReady === 'function') {
      try {
        await auth.authStateReady();
        currentUser = auth.currentUser;
      } catch (err) {
        console.warn('[firestoreSync] Erro ao aguardar authStateReady:', err);
      }
    }

    if (!currentUser) {
      currentUser = await new Promise<FirebaseUser | null>((resolve) => {
        const unsubscribe = onAuthStateChanged(
          auth,
          (user) => {
            unsubscribe();
            resolve(user);
          },
          (error) => {
            console.warn('[firestoreSync] Erro no listener do onAuthStateChanged:', error);
            unsubscribe();
            resolve(null);
          }
        );
      });
    }
  }

  if (!currentUser) {
    return null;
  }

  // Validação explícita do token de sessão ativo
  try {
    const token = await currentUser.getIdToken();
    if (!token) {
      return null;
    }
    return currentUser;
  } catch (tokenErr) {
    console.warn('[firestoreSync] Falha na validação do token JWT do usuário:', tokenErr);
    return null;
  }
}

/**
 * Salva ou atualiza um Produto no Firestore
 */
export async function persistProductToFirestore(product: Product): Promise<boolean> {
  try {
    const docRef = doc(db, 'products', product.id);
    await setDoc(
      docRef,
      {
        ...product,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `products/${product.id}`);
    return false;
  }
}

/**
 * Remove um Produto do Firestore
 */
export async function removeProductFromFirestore(productId: string): Promise<void> {
  try {
    const docRef = doc(db, 'products', productId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `products/${productId}`);
  }
}

/**
 * Salva ou atualiza uma Loja / Prestador no Firestore
 */
export async function persistMerchantToFirestore(merchant: StoreMerchant): Promise<boolean> {
  try {
    const docRef = doc(db, 'merchants', merchant.id);
    await setDoc(
      docRef,
      {
        ...merchant,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `merchants/${merchant.id}`);
    return false;
  }
}

/**
 * Salva ou atualiza um Usuário (Cliente, Vendedor, Master, Prestador) no Firestore
 */
export async function persistUserToFirestore(user: User): Promise<boolean> {
  try {
    const authUser = await ensureAuthenticatedUser();
    const firestoreUserId = authUser?.uid || auth.currentUser?.uid || user.id;
    const docRef = doc(db, 'users', firestoreUserId);

    const removeUndefinedDeep = (value: any): any => {
      if (Array.isArray(value)) {
        return value
          .filter((item) => item !== undefined)
          .map((item) => removeUndefinedDeep(item));
      }

      if (
        value !== null &&
        typeof value === 'object' &&
        Object.getPrototypeOf(value) === Object.prototype
      ) {
        return Object.fromEntries(
          Object.entries(value)
            .filter(([, item]) => item !== undefined)
            .map(([key, item]) => [key, removeUndefinedDeep(item)])
        );
      }

      return value;
    };

    const userData = removeUndefinedDeep({ ...user, id: firestoreUserId });

    if (user.id === 'master-contingency-backend' || user.id === 'user-master-david') {
      let token = typeof sessionStorage !== 'undefined'
        ? sessionStorage.getItem('MASTER_CONTINGENCY_TOKEN')
        : null;

      // Se o token não for encontrado na sessão, tenta recuperar o token atualizado diretamente pelo firebase/auth
      if (!token && (authUser || auth.currentUser)) {
        try {
          const activeAuthUser = authUser || auth.currentUser;
          token = await activeAuthUser?.getIdToken(true) || null;
          if (token && typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('MASTER_CONTINGENCY_TOKEN', token);
          }
        } catch (tokenErr) {
          console.warn('[MASTER CONTINGENCY] Erro ao recuperar token atualizado pelo firebase/auth:', tokenErr);
        }
      }

      // Se o token ainda não for encontrado, não roda a requisição "no vazio"
      if (!token) {
        console.warn('[MASTER CONTINGENCY] Token não encontrado na sessão nem no Firebase Auth.');
        notifySessionExpired('Sua sessão expirou. Faça login novamente para continuar.');
        return false;
      }

      const response = await fetch(
        '/api/master-contingency/user/save',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user: userData,
          }),
        }
      );

      // Tratamento de token expirado (401/403)
      if (response.status === 401 || response.status === 403) {
        console.warn('[MASTER CONTINGENCY] Token expirado ou não autorizado pelo backend. Tentando renovação...');
        if (authUser || auth.currentUser) {
          try {
            const activeAuthUser = authUser || auth.currentUser;
            const refreshedToken = await activeAuthUser?.getIdToken(true);
            if (refreshedToken && refreshedToken !== token) {
              if (typeof sessionStorage !== 'undefined') {
                sessionStorage.setItem('MASTER_CONTINGENCY_TOKEN', refreshedToken);
              }
              const retryResponse = await fetch('/api/master-contingency/user/save', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${refreshedToken}`,
                },
                body: JSON.stringify({ user: userData }),
              });
              const retryResult = await retryResponse.json().catch(() => null);
              if (retryResponse.ok && retryResult?.success) {
                return true;
              }
            }
          } catch (retryErr) {
            console.warn('[MASTER CONTINGENCY] Falha ao renovar token após erro 401:', retryErr);
          }
        }

        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('MASTER_CONTINGENCY_TOKEN');
        }
        notifySessionExpired('Sua sessão expirou. Faça login novamente.');
        return false;
      }

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        console.error(
          '[MASTER CONTINGENCY] Falha ao salvar:',
          result?.message || response.statusText
        );
        return false;
      }

      return true;
    }

    // Para usuários padrão do Firebase, assegura que exista credencial autenticada ativa
    if (!authUser && !auth.currentUser) {
      console.warn('[firestoreSync] persistUserToFirestore cancelado: Nenhum usuário autenticado no Firebase.');
      notifySessionExpired('Sua sessão expirou. Faça login novamente para salvar as alterações.');
      return false;
    }

    await setDoc(
      docRef,
      {
        ...userData,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.id}`);
    return false;
  }
}

/**
 * Salva ou atualiza uma Entrega / Corrida no Firestore
 */
export async function persistDeliveryRideToFirestore(ride: DeliveryRide): Promise<void> {
  try {
    const docRef = doc(db, 'deliveryRides', ride.id);
    await setDoc(
      docRef,
      {
        ...ride,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `deliveryRides/${ride.id}`);
  }
}

/**
 * Salva ou atualiza um Entregador Parceiro no Firestore
 */
export async function persistDeliveryDriverToFirestore(driver: DeliveryDriver): Promise<boolean> {
  try {
    const docRef = doc(db, 'deliveryDrivers', driver.id);
    await setDoc(
      docRef,
      {
        ...driver,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `deliveryDrivers/${driver.id}`);
    return false;
  }
}

/**
 * Salva ou atualiza um Pedido no Firestore
 */
export async function persistOrderToFirestore(order: Order): Promise<void> {
  try {
    const docRef = doc(db, 'orders', order.id);
    await setDoc(
      docRef,
      {
        ...order,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `orders/${order.id}`);
  }
}

/**
 * Salva um Registro de Auditoria no Firestore
 */
export async function persistAuditLogToFirestore(log: AuditLog): Promise<void> {
  try {
    const docRef = doc(db, 'auditLogs', log.id);
    await setDoc(docRef, {
      ...log,
      timestampServer: serverTimestamp(),
    });
  } catch (error) {
    // Audit logs non-blocking
    console.warn('AuditLog sync non-blocking warning:', error);
  }
}

/**
 * Carrega coleções do Firestore para hidratar a aplicação.
 * Só executa se houver um usuário autenticado no Firebase Auth —
 * caso contrário retorna objeto vazio para evitar erros de permissão.
 */
export async function fetchAllCollectionsFromFirestore(): Promise<{
  merchants?: StoreMerchant[];
  products?: Product[];
  orders?: Order[];
  deliveryDrivers?: DeliveryDriver[];
  deliveryRides?: DeliveryRide[];
  users?: User[];
}> {
  // Aguarda explicitamente a inicialização do Firebase Auth e validação do token
  // Sem token válido, o Firestore rejeita requisições com "Missing or insufficient permissions".
  const authUser = await ensureAuthenticatedUser();
  if (!authUser) {
    console.warn('[firestoreSync] fetchAllCollections ignorado: Nenhum usuário autenticado no Firebase Auth ou token inválido.');
    return {};
  }

  const result: {
    merchants?: StoreMerchant[];
    products?: Product[];
    orders?: Order[];
    deliveryDrivers?: DeliveryDriver[];
    deliveryRides?: DeliveryRide[];
    users?: User[];
  } = {};

  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    if (!usersSnap.empty) {
      result.users = usersSnap.docs.map((d) => d.data() as User);
    }
  } catch (err) {
    console.warn('Erro ao carregar users do Firestore:', err);
  }

  try {
    const merchantsSnap = await getDocs(collection(db, 'merchants'));
    if (!merchantsSnap.empty) {
      result.merchants = merchantsSnap.docs.map((d) => d.data() as StoreMerchant);
    }
  } catch (err) {
    console.warn('Erro ao carregar merchants do Firestore:', err);
  }

  try {
    const productsSnap = await getDocs(collection(db, 'products'));
    if (!productsSnap.empty) {
      result.products = productsSnap.docs.map((d) => d.data() as Product);
    }
  } catch (err) {
    console.warn('Erro ao carregar products do Firestore:', err);
  }

  try {
    const ordersSnap = await getDocs(collection(db, 'orders'));
    if (!ordersSnap.empty) {
      result.orders = ordersSnap.docs.map((d) => d.data() as Order);
    }
  } catch (err) {
    console.warn('Erro ao carregar orders do Firestore:', err);
  }

  try {
    const driversSnap = await getDocs(collection(db, 'deliveryDrivers'));
    if (!driversSnap.empty) {
      result.deliveryDrivers = driversSnap.docs.map((d) => d.data() as DeliveryDriver);
    }
  } catch (err) {
    console.warn('Erro ao carregar deliveryDrivers do Firestore:', err);
  }

  try {
    const ridesSnap = await getDocs(collection(db, 'deliveryRides'));
    if (!ridesSnap.empty) {
      result.deliveryRides = ridesSnap.docs.map((d) => d.data() as DeliveryRide);
    }
  } catch (err) {
    console.warn('Erro ao carregar deliveryRides do Firestore:', err);
  }

  return result;
}


/**
 * Carga inicial em lote para garantir que todo o catálogo, lojas, prestadores
 * e entregadores sejam persistidos no Firestore caso o banco esteja novo/vazio.
 */
export async function seedInitialDataToFirestoreIfEmpty(data: {
  merchants: StoreMerchant[];
  products: Product[];
  deliveryDrivers: DeliveryDriver[];
  deliveryRides: DeliveryRide[];
  users: User[];
}): Promise<void> {
  try {
    const authUser = await ensureAuthenticatedUser();
    if (!authUser) {
      console.warn('[firestoreSync] seedInitialData ignorado: Nenhum usuário autenticado no Firebase Auth.');
      return;
    }

    const productsSnap = await getDocs(collection(db, 'products'));
    if (productsSnap.empty && data.products.length > 0) {
      console.log('Semeando banco de dados Firestore com produtos e lojas reais...');
      const batch = writeBatch(db);

      // Semeia produtos
      for (const p of data.products.slice(0, 50)) {
        const ref = doc(db, 'products', p.id);
        batch.set(ref, { ...p, seededAt: new Date().toISOString() }, { merge: true });
      }

      // Semeia lojas
      for (const m of data.merchants.slice(0, 30)) {
        const ref = doc(db, 'merchants', m.id);
        batch.set(ref, { ...m, seededAt: new Date().toISOString() }, { merge: true });
      }

      // Semeia entregadores
      for (const d of data.deliveryDrivers) {
        const ref = doc(db, 'deliveryDrivers', d.id);
        batch.set(ref, { ...d, seededAt: new Date().toISOString() }, { merge: true });
      }

      // Semeia corridas
      for (const r of data.deliveryRides) {
        const ref = doc(db, 'deliveryRides', r.id);
        batch.set(ref, { ...r, seededAt: new Date().toISOString() }, { merge: true });
      }

      await batch.commit();
      console.log('Banco de dados Firestore semeado com sucesso!');
    }
  } catch (err) {
    console.warn('Aviso de seed Firestore (não-bloqueante):', err);
  }
}




