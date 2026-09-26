import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  getAuth,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { User, StoreMerchant, UserRole, MembershipTier } from '../types';
import { initializeApp, deleteApp } from 'firebase/app';
import firebaseConfig from '../../firebase-applet-config.json';

/**
 * Traduz cÃ³digos de erro do Firebase Auth para mensagens amigÃ¡veis em portuguÃªs
 */
export function getFirebaseAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'O formato do e-mail informado Ã© invÃ¡lido.';
    case 'auth/user-not-found':
      return 'Nenhuma conta encontrada com este e-mail. Por favor, cadastre-se.';
    case 'auth/wrong-password':
      return 'Senha incorreta. Verifique suas credenciais de acesso.';
    case 'auth/invalid-credential':
      return 'Credenciais de acesso incorretas. Verifique seu e-mail e senha.';
    case 'auth/email-already-in-use':
      return 'Este e-mail jÃ¡ estÃ¡ cadastrado. Tente entrar ou recupere sua senha.';
    case 'auth/weak-password':
      return 'A senha deve conter no mÃ­nimo 6 caracteres.';
    case 'auth/popup-closed-by-user':
      return 'A janela de autenticaÃ§Ã£o do Google foi fechada antes da conclusÃ£o.';
    case 'auth/popup-blocked':
      return 'O navegador bloqueou o pop-up de login. Permita pop-ups para este site.';
    case 'auth/cancelled-popup-request':
      return 'OperaÃ§Ã£o de autenticaÃ§Ã£o cancelada pelo navegador.';
    case 'auth/network-request-failed':
      return 'Falha de comunicaÃ§Ã£o com os servidores do Firebase. Verifique sua conexÃ£o Ã  internet.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas sem sucesso. Aguarde alguns minutos antes de tentar novamente.';
    case 'auth/operation-not-allowed':
      return 'Este mÃ©todo de autenticaÃ§Ã£o nÃ£o estÃ¡ habilitado no Console do Firebase.';
    default:
      return 'Ocorreu um erro na autenticaÃ§Ã£o. Verifique os dados e tente novamente.';
  }
}

/**
 * Mapeia ou provisiona o usuÃ¡rio no Firestore /users/{uid}
 */
export async function syncUserWithFirestore(
  fbUser: FirebaseUser,
  defaultRole: UserRole = 'CLIENTE',
  extraData?: Partial<User>
): Promise<User> {
  const uid = fbUser.uid;
  const userDocRef = doc(db, 'users', uid);

  try {
    const snap = await getDoc(userDocRef);
    const email = fbUser.email?.toLowerCase().trim() || '';
    const isMasterEmail = email === 'telecom.david@gmail.com' || email === 'admin@acheiaqui.com.br' || email === 'espier.telecom@gmail.com';

    if (snap.exists()) {
      const data = snap.data();
      const role: UserRole = isMasterEmail ? 'MASTER' : (data.role as UserRole) || defaultRole;

      const updatedUser: User = {
        id: uid,
        name: data.name || fbUser.displayName || email.split('@')[0],
        email: email || data.email,
        phone: data.phone || fbUser.phoneNumber || '(21) 99999-0000',
        role,
        membershipTier: (data.membershipTier as MembershipTier) || 'GRATIS',
        city: data.city || 'Cachoeiras de Macacu, RJ',
        address: data.address || '',
        neighborhood: data.neighborhood || 'Centro',
        merchantId: data.merchantId,
        isEmailVerified: fbUser.emailVerified || data.isEmailVerified || false,
        twoFactorEnabled: isMasterEmail ? true : !!data.twoFactorEnabled,
        status: data.status || 'active',
        statusReason: data.statusReason,
        lastLogin: new Date().toISOString(),
        createdAt: data.createdAt || new Date().toISOString(),
        ...extraData,
      };

      // Atualiza Ãºltimo login
      await updateDoc(userDocRef, {
        lastLogin: serverTimestamp(),
        isEmailVerified: fbUser.emailVerified,
      }).catch(() => {
        // TolerÃ¢ncia para offline
      });

      return updatedUser;
    } else {
      // Novo perfil no Firestore
      const role: UserRole = isMasterEmail ? 'MASTER' : defaultRole;
      const newUser: User = {
        id: uid,
        name: extraData?.name || fbUser.displayName || email.split('@')[0],
        email,
        phone: extraData?.phone || fbUser.phoneNumber || '(21) 99999-0000',
        role,
        membershipTier: extraData?.membershipTier || (role === 'MASTER' ? 'MASTER' : 'GRATIS'),
        city: extraData?.city || 'Cachoeiras de Macacu, RJ',
        address: extraData?.address || '',
        neighborhood: extraData?.neighborhood || 'Centro',
        merchantId: extraData?.merchantId,
        cpf: extraData?.cpf,
        isEmailVerified: fbUser.emailVerified,
        twoFactorEnabled: role === 'MASTER' || role === 'VENDEDOR',
        status: 'active',
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        ...extraData,
      };

      await setDoc(userDocRef, {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        membershipTier: newUser.membershipTier,
        city: newUser.city,
        address: newUser.address,
        neighborhood: newUser.neighborhood,
        merchantId: newUser.merchantId || null,
        cpf: newUser.cpf || null,
        isEmailVerified: newUser.isEmailVerified,
        twoFactorEnabled: newUser.twoFactorEnabled,
        status: newUser.status,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });

      return newUser;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }
}

/**
 * Login com E-mail e Senha via Firebase Authentication
 */
export async function firebaseLoginWithEmail(
  email: string,
  password: string
): Promise<{
  success: boolean;
  user?: User;
  message?: string;
  requires2FA?: boolean;
  simulated2FACode?: string;
}> {
  const cleanEmail = email.trim().toLowerCase();

  try {
    // ETAPA 1: autenticação real no Firebase Authentication.
    // Se esta etapa funcionar, a senha está correta.
    const userCredential = await signInWithEmailAndPassword(
      auth,
      cleanEmail,
      password
    );

    const fbUser = userCredential.user;

    // Perfil mínimo baseado exclusivamente no Firebase Authentication.
    // Isso impede que uma falha posterior do Firestore seja apresentada
    // incorretamente como erro de e-mail ou senha.
    let user: User = {
      id: fbUser.uid,
      name: fbUser.displayName || cleanEmail.split('@')[0],
      email: cleanEmail,
      phone: fbUser.phoneNumber || '',
      role: 'CLIENTE',
      membershipTier: 'GRATIS',
      city: 'Cachoeiras de Macacu, RJ',
      address: '',
      neighborhood: 'Centro',
      isEmailVerified: fbUser.emailVerified,
      twoFactorEnabled: false,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    // ETAPA 2: recuperar perfil Firestore.
    // Se houver problema no Firestore, a autenticação continua válida.
    try {
      const firestoreUser = await syncUserWithFirestore(fbUser);

      if (firestoreUser) {
        user = firestoreUser;
      }
    } catch (firestoreError: any) {
      console.error(
        '[FIREBASE LOGIN] Autenticacao OK; falha ao carregar perfil Firestore:',
        firestoreError
      );
    }

    // A identidade MASTER continua sendo reconhecida diretamente pelo e-mail.
    if (cleanEmail === 'telecom.david@gmail.com' || cleanEmail === 'admin@acheiaqui.com.br') {
      user.role = 'MASTER';
      user.membershipTier = 'MASTER';
      user.twoFactorEnabled = true;
    }

    // Bloqueio de conta somente depois da autenticação.
    if (user.status === 'blocked' || user.status === 'suspended') {
      await signOut(auth);

      return {
        success: false,
        message: `Acesso suspenso ou bloqueado: ${user.statusReason || 'Entre em contato com a administração AcheiaKi.'}`,
      };
    }

    // 2FA somente para usuários realmente configurados para isso.
    const isHighPrivilege =
      user.role === 'MASTER' ||
      user.role === 'VENDEDOR' ||
      user.twoFactorEnabled;

    if (isHighPrivilege) {
      const code = '749210';

      sessionStorage.setItem(
        `2fa_code_${cleanEmail}`,
        code
      );

      return {
        success: false,
        requires2FA: true,
        user,
        simulated2FACode: code,
        message: `Código de verificação em 2 etapas gerado para ${user.phone || user.email}.`,
      };
    }

    // AUTENTICAÇÃO CONCLUÍDA.
    return {
      success: true,
      user,
    };

  } catch (error: any) {
    console.error('[FIREBASE LOGIN AUTH]', {
      code: error?.code,
      message: error?.message,
      email: cleanEmail,
    });

    // Somente erros reais do Firebase Authentication chegam aqui.
    const msg = getFirebaseAuthErrorMessage(error?.code);

    return {
      success: false,
      message: msg,
    };
  }
}
export async function firebaseRegisterCustomer(params: {
  name: string;
  email: string;
  password: string;
  phone: string;
  cpf?: string;
  city?: string;
  address?: string;
  neighborhood?: string;
  membershipTier?: MembershipTier;
}): Promise<{
  success: boolean;
  user?: User;
  message?: string;
}> {
  try {
    const cleanEmail = params.email.trim().toLowerCase();
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, params.password);
    const fbUser = userCredential.user;

    // Atualiza nome no perfil auth
    await updateProfile(fbUser, {
      displayName: params.name,
    }).catch(() => {});

    // Salva perfil no Firestore
    const user = await syncUserWithFirestore(fbUser, 'CLIENTE', {
      name: params.name,
      phone: params.phone,
      cpf: params.cpf,
      city: params.city || 'Cachoeiras de Macacu, RJ',
      address: params.address || 'Centro',
      neighborhood: params.neighborhood || 'Centro',
      membershipTier: params.membershipTier || 'GRATIS',
    });

    return {
      success: true,
      user,
      message: 'Conta de cliente criada com sucesso no Firebase!',
    };
  } catch (error: any) {
    const msg = getFirebaseAuthErrorMessage(error.code);
    return {
      success: false,
      message: msg,
    };
  }
}

/**
 * Cadastro de Lojista / Prestador de ServiÃ§os com Firebase Authentication e Firestore
 */
export async function firebaseUpdatePassword(newPassword: string): Promise<{ success: boolean; message: string }> {
  try {
    const currentFirebaseUser = auth.currentUser;
    if (!currentFirebaseUser) return { success: false, message: 'Nenhuma sessao ativa no Firebase.' };
    if (!newPassword || newPassword.length < 6) return { success: false, message: 'A nova senha deve conter no minimo 6 caracteres.' };
    await updatePassword(currentFirebaseUser, newPassword);
    return { success: true, message: 'Senha alterada com sucesso no Firebase Authentication.' };
  } catch (error: any) {
    console.error('[FIREBASE UPDATE PASSWORD]', error);
    const code = error?.code || '';
    if (code === 'auth/requires-recent-login') return { success: false, message: 'Por seguranca, entre novamente na conta e tente alterar a senha.' };
    if (code === 'auth/weak-password') return { success: false, message: 'A nova senha deve conter no minimo 6 caracteres.' };
    return { success: false, message: getFirebaseAuthErrorMessage(code) || 'Nao foi possivel alterar a senha no Firebase.' };
  }
}

export async function firebaseRegisterMerchant(params: {
  ownerName: string;
  storeName: string;
  email: string;
  password: string;
  phone: string;
  cnpjOrCpf?: string;
  category?: string;
  subcategory?: string;
  city?: string;
  address?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  description?: string;
  isServiceProvider?: boolean;
  membershipTier?: MembershipTier;
}): Promise<{
  success: boolean;
  user?: User;
  merchant?: StoreMerchant;
  message?: string;
}> {
  try {
    const cleanEmail = params.email.trim().toLowerCase();
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, params.password);
    const fbUser = userCredential.user;

    await updateProfile(fbUser, {
      displayName: params.ownerName,
    }).catch(() => {});

    const storeId = `store-${fbUser.uid.slice(0, 12)}-${Date.now()}`;
    const selectedTier: MembershipTier = params.membershipTier || 'GRATIS';

    // Cria documento da loja / prestador no Firestore
    const merchantDocRef = doc(db, 'merchants', storeId);
    const newMerchant: StoreMerchant = {
      id: storeId,
      name: params.storeName,
      ownerName: params.ownerName,
      email: cleanEmail,
      phone: params.phone,
      cnpjOrCpf: params.cnpjOrCpf || '00.000.000/0001-00',
      category: params.category || (params.isServiceProvider ? 'PRESTADORES DE SERVIÃ‡OS' : 'GASTRONOMIA'),
      subcategory: params.subcategory || '',
      description: params.description || (params.isServiceProvider ? 'Prestador de serviÃ§os verificado no Achei Aqui.' : 'Loja credenciada no Achei Aqui.'),
      address: params.address || `${params.street || 'Rua Principal'}, ${params.number || '100'}`,
      street: params.street,
      number: params.number,
      neighborhood: params.neighborhood || 'Centro',
      city: params.city || 'Cachoeiras de Macacu, RJ',
      zipCode: '28680-000',
      isServiceProvider: !!params.isServiceProvider,
      offeredItemTypes: params.isServiceProvider ? ['SERVICO', 'MANUTENCAO'] : ['PRODUTO_FISICO'],
      isVerifiedProvider: true,
      logo: params.isServiceProvider
        ? 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=160&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=160&auto=format&fit=crop&q=80',
      rating: 5.0,
      reviewsCount: 1,
      isOpen: true,
      openingHours: '08:00 Ã s 18:00',
      deliveryFee: 0,
      deliveryTimeEstimate: params.isServiceProvider ? 'Sob Agendamento' : '30-45 min',
      supportsPickup: true,
      supportsTrial: false,
      supportsAppointments: true,
      membershipTier: selectedTier,
      status: 'approved',
      submittedAt: new Date().toISOString(),
    };

    try {
      await setDoc(merchantDocRef, {
        ...newMerchant,
        ownerId: fbUser.uid,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `merchants/${storeId}`);
    }

    // Salva perfil do usuÃ¡rio no Firestore com role LOJISTA ou PRESTADOR_SERVICO
    const roleToAssign = params.isServiceProvider ? 'PRESTADOR_SERVICO' : 'LOJISTA';
    const user = await syncUserWithFirestore(fbUser, roleToAssign, {
      name: params.ownerName,
      phone: params.phone,
      role: roleToAssign,
      merchantId: storeId,
      membershipTier: selectedTier,
      city: params.city || 'Cachoeiras de Macacu, RJ',
      address: params.address || `${params.street || 'Rua Principal'}, ${params.number || '100'}`,
      neighborhood: params.neighborhood || 'Centro',
      twoFactorEnabled: true,
    });

    return {
      success: true,
      user,
      merchant: newMerchant,
      message: 'Cadastro de lojista e loja concluÃ­dos com sucesso no Firebase!',
    };
  } catch (error: any) {
    const msg = getFirebaseAuthErrorMessage(error.code);
    return {
      success: false,
      message: msg,
    };
  }
}

/**
 * Login ou Cadastro com Google via Firebase Auth Popup
 */
export async function firebaseLoginWithGoogle(
  rolePreference: UserRole = 'CLIENTE'
): Promise<{
  success: boolean;
  user?: User;
  message?: string;
}> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account',
    });

    const userCredential = await signInWithPopup(auth, provider);
    const fbUser = userCredential.user;

    const user = await syncUserWithFirestore(fbUser, rolePreference);

    if (user.status === 'blocked' || user.status === 'suspended') {
      await signOut(auth);
      return {
        success: false,
        message: `Acesso suspenso ou bloqueado: ${user.statusReason || 'Entre em contato com a administraÃ§Ã£o.'}`,
      };
    }

    return {
      success: true,
      user,
      message: `Autenticado com sucesso via Google (${user.name})!`,
    };
  } catch (error: any) {
    const msg = getFirebaseAuthErrorMessage(error.code);
    return {
      success: false,
      message: msg,
    };
  }
}

/**
 * Envio de e-mail oficial de redefiniÃ§Ã£o de senha via Firebase Auth
 */
export async function firebaseSendPasswordReset(
  email: string
): Promise<{ success: boolean; message: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    await sendPasswordResetEmail(auth, cleanEmail);
    return {
      success: true,
      message: `Link de redefiniÃ§Ã£o de senha enviado com sucesso para ${cleanEmail}. Verifique sua caixa de entrada e spam.`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: getFirebaseAuthErrorMessage(error.code),
    };
  }
}

/**
 * Encerra sessÃ£o do usuÃ¡rio no Firebase Auth
 */
export async function firebaseLogout(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Erro ao deslogar do Firebase:', error);
  }
}

/**
 * Observa alteraÃ§Ãµes no estado de autenticaÃ§Ã£o do Firebase
 */
export function subscribeToFirebaseAuthState(
  callback: (user: User | null, fbUser: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      try {
        const appUser = await syncUserWithFirestore(fbUser);
        callback(appUser, fbUser);
      } catch (err) {
        console.warn('NÃ£o foi possÃ­vel sincronizar perfil do Firestore para usuÃ¡rio logado:', err);
        // Fallback mÃ­nimo a partir dos dados do Firebase Auth
        const fallbackUser: User = {
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'UsuÃ¡rio',
          email: fbUser.email || '',
          phone: fbUser.phoneNumber || '(21) 99999-0000',
          role: (fbUser.email === 'telecom.david@gmail.com' || fbUser.email === 'espier.telecom@gmail.com') ? 'MASTER' : 'CLIENTE',
          city: 'Cachoeiras de Macacu, RJ',
          isEmailVerified: fbUser.emailVerified,
          createdAt: new Date().toISOString(),
        };
        callback(fallbackUser, fbUser);
      }
    } else {
      callback(null, null);
    }
  });
}


/**
 * Atualiza a senha real do usuÃ¡rio autenticado no Firebase Authentication.
 */
export async function firebaseProvisionSalesAgent(
  email: string,
  password: string,
  userData: Partial<User>
): Promise<{ success: boolean; user?: User; message: string }> {
  let secondaryApp;

  try {
    const cleanEmail = email.trim().toLowerCase();

    secondaryApp = initializeApp(
      firebaseConfig,
      `acheiaki-sales-agent-${Date.now()}`
    );

    const secondaryAuth = getAuth(secondaryApp);

    const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);

    const fbUser = credential.user;

    const passwordValidation = await signInWithEmailAndPassword(
      auth,
      cleanEmail,
      password
    );

    if (!passwordValidation.user || passwordValidation.user.uid !== fbUser.uid) {
      throw new Error('O Firebase criou a conta, mas a senha nao foi validada na autenticacao.');
    }

    const provisionedUser: User = {
      id: fbUser.uid,
      name: userData.name || cleanEmail.split('@')[0],
      email: cleanEmail,
      phone: userData.phone || '',
      role: 'VENDEDOR',
      password,
      needsPasswordChange: true,
      city: userData.city || 'Cachoeiras de Macacu, RJ',
      isEmailVerified: false,
      twoFactorEnabled: false,
      createdAt: userData.createdAt || new Date().toISOString()
    };

    await setDoc(
      doc(db, 'users', fbUser.uid),
      {
        ...provisionedUser,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    return {
      success: true,
      user: provisionedUser,
      message: 'Credencial do vendedor criada no Firebase.'
    };
  } catch (error: any) {
    console.error('[SALES AGENT FIREBASE]', error);

    if (error?.code === 'auth/email-already-in-use') {
      return {
        success: false,
        message: 'Este e-mail jÃ¡ possui uma credencial no Firebase.'
      };
    }

    return {
      success: false,
      message: getFirebaseAuthErrorMessage(error?.code || '')
    };
  } finally {
    if (secondaryApp) {
      await deleteApp(secondaryApp).catch(() => {});
    }
  }
}
export async function firebaseUpdateAuthenticatedPassword(
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  try {
    const password = newPassword.trim();

    if (password.length < 8) {
      return {
        success: false,
        message: 'A nova senha deve possuir no mÃ­nimo 8 caracteres.'
      };
    }

    if (!auth.currentUser) {
      return {
        success: false,
        message: 'Nenhum usuÃ¡rio autenticado no Firebase.'
      };
    }

    await updatePassword(auth.currentUser, password);

    return {
      success: true,
      message: 'Senha atualizada com sucesso.'
    };
  } catch (error: any) {
    console.error('Erro ao atualizar senha no Firebase:', error);

    return {
      success: false,
      message: getFirebaseAuthErrorMessage(error?.code || '')
    };
  }
}



export async function firebaseProvisionUser(
  email: string,
  password: string,
  userData: Partial<User> & {
    role: UserRole;
    merchantId?: string;
  }
): Promise<{ success: boolean; user?: User; message: string }> {
  let secondaryApp;

  try {
    const cleanEmail = email.trim().toLowerCase();

    secondaryApp = initializeApp(
      firebaseConfig,
      `acheiaki-user-${Date.now()}`
    );

    const secondaryAuth = getAuth(secondaryApp);

    const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);

    const fbUser = credential.user;

    const passwordValidation = await signInWithEmailAndPassword(
      auth,
      cleanEmail,
      password
    );

    if (!passwordValidation.user || passwordValidation.user.uid !== fbUser.uid) {
      throw new Error('O Firebase criou a conta, mas a senha nao foi validada na autenticacao.');
    }

    await updateProfile(fbUser, {
      displayName: userData.name || cleanEmail.split('@')[0]
    }).catch(() => {});

    const provisionedUser: User = {
      id: fbUser.uid,
      name: userData.name || cleanEmail.split('@')[0],
      email: cleanEmail,
      phone: userData.phone || '',
      role: userData.role,
      password,
      merchantId: userData.merchantId,
      membershipTier: userData.membershipTier || 'GRATIS',
      needsPasswordChange: userData.needsPasswordChange ?? false,
      city: userData.city || 'Cachoeiras de Macacu, RJ',
      address: userData.address,
      neighborhood: userData.neighborhood,
      cpf: userData.cpf,
      idDocument: userData.idDocument,
      references: userData.references,
      isEmailVerified: false,
      twoFactorEnabled: userData.twoFactorEnabled ?? false,
      createdAt: userData.createdAt || new Date().toISOString()
    };


    return {
      success: true,
      user: provisionedUser,
      message: 'Credencial criada no Firebase.'
    };
  } catch (error: any) {
    console.error('[FIREBASE PROVISION USER]', error);

    if (error?.code === 'auth/email-already-in-use') {
      return {
        success: false,
        message: 'Este e-mail jÃ¡ possui uma credencial no Firebase.'
      };
    }

    return {
      success: false,
      message: getFirebaseAuthErrorMessage(error?.code || '')
    };
  } finally {
    if (secondaryApp) {
      await deleteApp(secondaryApp).catch(() => {});
    }
  }
}











