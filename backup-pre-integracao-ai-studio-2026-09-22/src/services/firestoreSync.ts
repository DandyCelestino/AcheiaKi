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
import { db, OperationType, handleFirestoreError } from '../firebase';
import { Product, StoreMerchant, User, DeliveryRide, DeliveryDriver, Order, AuditLog } from '../types';

/**
 * Salva ou atualiza um Produto no Firestore
 */
export async function persistProductToFirestore(product: Product): Promise<void> {
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
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `products/${product.id}`);
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
export async function persistMerchantToFirestore(merchant: StoreMerchant): Promise<void> {
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
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `merchants/${merchant.id}`);
  }
}

/**
 * Salva ou atualiza um Usuário (Cliente, Vendedor, Master, Prestador) no Firestore
 */
export async function persistUserToFirestore(user: User): Promise<void> {
  try {
    const docRef = doc(db, 'users', user.id);
    await setDoc(
      docRef,
      {
        ...user,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.id}`);
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
export async function persistDeliveryDriverToFirestore(driver: DeliveryDriver): Promise<void> {
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
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `deliveryDrivers/${driver.id}`);
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
 * Carrega coleções do Firestore para hidratar a aplicação
 */
export async function fetchAllCollectionsFromFirestore(): Promise<{
  merchants?: StoreMerchant[];
  products?: Product[];
  orders?: Order[];
  deliveryDrivers?: DeliveryDriver[];
  deliveryRides?: DeliveryRide[];
  users?: User[];
}> {
  const result: {
    merchants?: StoreMerchant[];
    products?: Product[];
    orders?: Order[];
    deliveryDrivers?: DeliveryDriver[];
    deliveryRides?: DeliveryRide[];
    users?: User[];
  } = {};

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
