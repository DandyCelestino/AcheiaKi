import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  sendEmailVerification,
  onAuthStateChanged,
  updateProfile,
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

/**
 * Traduz códigos de erro do Firebase Auth para mensagens amigáveis em português
 */
export function getFirebaseAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'O formato do e-mail informado é inválido.';
    case 'auth/user-not-found':
      return 'Nenhuma conta encontrada com este e-mail. Por favor, cadastre-se.';
    case 'auth/wrong-password':
      return 'Senha incorreta. Verifique suas credenciais de acesso.';
    case 'auth/invalid-credential':
      return 'Credenciais de acesso incorretas. Verifique seu e-mail e senha.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado. Tente entrar ou recupere sua senha.';
    case 'auth/weak-password':
      return 'A senha deve conter no mínimo 6 caracteres.';
    case 'auth/popup-closed-by-user':
      return 'A janela de autenticação do Google foi fechada antes da conclusão.';
    case 'auth/popup-blocked':
      return 'O navegador bloqueou o pop-up de login. Permita pop-ups para este site.';
    case 'auth/cancelled-popup-request':
      return 'Operação de autenticação cancelada pelo navegador.';
    case 'auth/network-request-failed':
      return 'Falha de comunicação com os servidores do Firebase. Verifique sua conexão à internet.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas sem sucesso. Aguarde alguns minutos antes de tentar novamente.';
    case 'auth/operation-not-allowed':
      return 'Este método de autenticação não está habilitado no Console do Firebase.';
    default:
      return 'Ocorreu um erro na autenticação. Verifique os dados e tente novamente.';
  }
}

/**
 * Mapeia ou provisiona o usuário no Firestore /users/{uid}
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
    const isMasterEmail = email === 'telecom.david@gmail.com' || email === 'admin@acheiaqui.com.br';

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

      // Atualiza último login
      await updateDoc(userDocRef, {
        lastLogin: serverTimestamp(),
        isEmailVerified: fbUser.emailVerified,
      }).catch(() => {
        // Tolerância para offline
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
  try {
    const cleanEmail = email.trim().toLowerCase();
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const fbUser = userCredential.user;

      const authenticatedEmail = (fbUser.email || "").trim().toLowerCase();

      // MASTER DE CONTINGENCIA - NAO CONSULTA FIRESTORE
      if (authenticatedEmail === "telecom.david@gmail.com") {
        const contingencyMaster: User = {
          id: `master-contingencia-${fbUser.uid}`,
          name: "David Celestino (Master de Contingencia)",
          email: "telecom.david@gmail.com",
          phone: fbUser.phoneNumber || "",
          role: "MASTER",
          city: "Cachoeiras de Macacu, RJ",
          isEmailVerified: true,
          needsPasswordChange: false,
          twoFactorEnabled: false,
          avatar: fbUser.photoURL || undefined,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };

        return {
          success: true,
          user: contingencyMaster,
          message: "MASTER de contingencia autenticado pelo Google sem consulta ao Firestore.",
        };
      }

    const user = await syncUserWithFirestore(fbUser);

    // Impede o acesso enquanto o endereço de e-mail não estiver verificado
    if (!fbUser.emailVerified) {
      return {
        success: false,
        user,
        message: 'Seu e-mail ainda não foi verificado. Verifique sua caixa de entrada e confirme o endereço antes de entrar no Achei Aqui.',
      };
    }

    if (user.status === 'blocked' || user.status === 'suspended') {
      await signOut(auth);
      return {
        success: false,
        message: `Acesso suspenso ou bloqueado: ${user.statusReason || 'Entre em contato com a administração Achei Aqui.'}`,
      };
    }

    // Validação 2FA para perfis com permissão elevada
    const isHighPrivilege = user.role === 'VENDEDOR' || (user.twoFactorEnabled && user.role !== 'MASTER');
    if (isHighPrivilege) {
      const code = '749210';
      sessionStorage.setItem(`2fa_code_${cleanEmail}`, code);
      return {
        success: false,
        requires2FA: true,
        user,
        simulated2FACode: code,
        message: `Código de verificação em 2 etapas gerado para ${user.phone || user.email}.`,
      };
    }

    return {
      success: true,
      user,
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
 * Cadastro de Cliente com Firebase Authentication e registro no Firestore
 */
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

      const authenticatedEmail = (fbUser.email || "").trim().toLowerCase();

      // MASTER DE CONTINGENCIA - NAO CONSULTA FIRESTORE
      if (authenticatedEmail === "telecom.david@gmail.com") {
        const contingencyMaster: User = {
          id: `master-contingencia-${fbUser.uid}`,
          name: "David Celestino (Master de Contingencia)",
          email: "telecom.david@gmail.com",
          phone: fbUser.phoneNumber || "",
          role: "MASTER",
          city: "Cachoeiras de Macacu, RJ",
          isEmailVerified: true,
          needsPasswordChange: false,
          twoFactorEnabled: false,
          avatar: fbUser.photoURL || undefined,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };

        return {
          success: true,
          user: contingencyMaster,
          message: "MASTER de contingencia autenticado pelo Google sem consulta ao Firestore.",
        };
      }

    // Envia e-mail oficial de verificação após o cadastro
    await sendEmailVerification(fbUser);

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
 * Cadastro de Lojista / Prestador de Serviços com Firebase Authentication e Firestore
 */
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

      const authenticatedEmail = (fbUser.email || "").trim().toLowerCase();

      // MASTER DE CONTINGENCIA - NAO CONSULTA FIRESTORE
      if (authenticatedEmail === "telecom.david@gmail.com") {
        const contingencyMaster: User = {
          id: `master-contingencia-${fbUser.uid}`,
          name: "David Celestino (Master de Contingencia)",
          email: "telecom.david@gmail.com",
          phone: fbUser.phoneNumber || "",
          role: "MASTER",
          city: "Cachoeiras de Macacu, RJ",
          isEmailVerified: true,
          needsPasswordChange: false,
          twoFactorEnabled: false,
          avatar: fbUser.photoURL || undefined,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };

        return {
          success: true,
          user: contingencyMaster,
          message: "MASTER de contingencia autenticado pelo Google sem consulta ao Firestore.",
        };
      }

    // Envia e-mail oficial de verificação após o cadastro
    await sendEmailVerification(fbUser);

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
      category: params.category || (params.isServiceProvider ? 'PRESTADORES DE SERVIÇOS' : 'GASTRONOMIA'),
      subcategory: params.subcategory || '',
      description: params.description || (params.isServiceProvider ? 'Prestador de serviços verificado no Achei Aqui.' : 'Loja credenciada no Achei Aqui.'),
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
      openingHours: '08:00 às 18:00',
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

    // Salva perfil do usuário no Firestore com role LOJISTA ou PRESTADOR_SERVICO
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
      message: 'Cadastro de lojista e loja concluídos com sucesso no Firebase!',
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

      const authenticatedEmail = (fbUser.email || "").trim().toLowerCase();

      // MASTER DE CONTINGENCIA - NAO CONSULTA FIRESTORE
      if (authenticatedEmail === "telecom.david@gmail.com") {
        const contingencyMaster: User = {
          id: `master-contingencia-${fbUser.uid}`,
          name: "David Celestino (Master de Contingencia)",
          email: "telecom.david@gmail.com",
          phone: fbUser.phoneNumber || "",
          role: "MASTER",
          city: "Cachoeiras de Macacu, RJ",
          isEmailVerified: true,
          needsPasswordChange: false,
          twoFactorEnabled: false,
          avatar: fbUser.photoURL || undefined,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };

        return {
          success: true,
          user: contingencyMaster,
          message: "MASTER de contingencia autenticado pelo Google sem consulta ao Firestore.",
        };
      }

    const user = await syncUserWithFirestore(fbUser, rolePreference);

    if (user.status === 'blocked' || user.status === 'suspended') {
      await signOut(auth);
      return {
        success: false,
        message: `Acesso suspenso ou bloqueado: ${user.statusReason || 'Entre em contato com a administração.'}`,
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
 * Envio de e-mail oficial de verificação de endereço via Firebase Auth
 */
export async function firebaseSendEmailVerification(): Promise<{ success: boolean; message: string }> {
  try {
    const user = auth.currentUser;

    if (!user) {
      return {
        success: false,
        message: 'Nenhum usuário autenticado para enviar a verificação de e-mail.',
      };
    }

    if (user.emailVerified) {
      return {
        success: true,
        message: 'Este endereço de e-mail já foi verificado.',
      };
    }

    await sendEmailVerification(user);

    return {
      success: true,
      message: `E-mail de verificação enviado para ${user.email || 'seu endereço de e-mail'}. Verifique também a pasta de spam.`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: getFirebaseAuthErrorMessage(error.code),
    };
  }
}
/**
 * Envio de e-mail oficial de redefinição de senha via Firebase Auth
 */
export async function firebaseSendPasswordReset(
  email: string
): Promise<{ success: boolean; message: string }> {
  try {
      const cleanEmail = email.trim().toLowerCase();

      const actionCodeSettings = {
        url: `${window.location.origin}/?mode=resetPassword`,
        handleCodeInApp: true
      };

      await sendPasswordResetEmail(
        auth,
        cleanEmail,
        actionCodeSettings
      );

      return {
        success: true,
        message: `Link de redefinição de senha enviado com sucesso para ${cleanEmail}. Verifique sua caixa de entrada e spam.`,
      };
  } catch (error: any) {
    return {
      success: false,
      message: getFirebaseAuthErrorMessage(error.code),
    };
  }
}

/**
 * Encerra sessão do usuário no Firebase Auth
 */
export async function firebaseVerifyPasswordResetCode(
  oobCode: string
): Promise<{ success: boolean; email?: string; message: string }> {
  try {
    const cleanCode = oobCode.trim();

    if (!cleanCode) {
      return {
        success: false,
        message: 'Código de redefinição não informado.'
      };
    }

    const email = await verifyPasswordResetCode(auth, cleanCode);

    return {
      success: true,
      email,
      message: 'Código de redefinição válido.'
    };
  } catch (error: any) {
    return {
      success: false,
      message: getFirebaseAuthErrorMessage(error.code)
    };
  }
}

export async function firebaseConfirmPasswordReset(
  oobCode: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  try {
    const cleanCode = oobCode.trim();

    if (!cleanCode) {
      return {
        success: false,
        message: 'Código de redefinição não informado.'
      };
    }

    if (!newPassword || newPassword.length < 6) {
      return {
        success: false,
        message: 'A nova senha deve possuir no mínimo 6 caracteres.'
      };
    }

    await confirmPasswordReset(auth, cleanCode, newPassword);

    return {
      success: true,
      message: 'Senha alterada com sucesso! Você já pode entrar com sua nova senha.'
    };
  } catch (error: any) {
    return {
      success: false,
      message: getFirebaseAuthErrorMessage(error.code)
    };
  }
}
export async function firebaseLogout(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Erro ao deslogar do Firebase:', error);
  }
}

/**
 * Observa alterações no estado de autenticação do Firebase
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
        console.warn('Não foi possível sincronizar perfil do Firestore para usuário logado:', err);
        // Fallback mínimo a partir dos dados do Firebase Auth
        const fallbackUser: User = {
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Usuário',
          email: fbUser.email || '',
          phone: fbUser.phoneNumber || '(21) 99999-0000',
          role: fbUser.email === 'telecom.david@gmail.com' ? 'MASTER' : 'CLIENTE',
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











