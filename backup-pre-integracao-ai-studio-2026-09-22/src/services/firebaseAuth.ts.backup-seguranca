import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  type User as FirebaseUser
} from 'firebase/auth';

import { firebaseAuth } from '../firebase';

export function getFirebaseAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'O formato do e-mail informado é inválido.';

    case 'auth/user-not-found':
      return 'Nenhuma conta encontrada com este e-mail.';

    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-mail ou senha incorretos.';

    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado.';

    case 'auth/weak-password':
      return 'A senha deve conter no mínimo 6 caracteres.';

    case 'auth/popup-closed-by-user':
      return 'A janela do Google foi fechada antes da conclusão.';

    case 'auth/popup-blocked':
      return 'O navegador bloqueou o pop-up de login.';

    case 'auth/cancelled-popup-request':
      return 'A autenticação foi cancelada.';

    case 'auth/network-request-failed':
      return 'Falha de comunicação com o Firebase. Verifique sua conexão.';

    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';

    case 'auth/operation-not-allowed':
      return 'Este método de autenticação ainda não está habilitado no Firebase.';

    default:
      return 'Não foi possível concluir a autenticação.';
  }
}

export async function firebaseLoginWithEmail(
  email: string,
  password: string
): Promise<{
  success: boolean;
  firebaseUser?: FirebaseUser;
  message?: string;
}> {
  try {
    const cleanEmail = email.trim().toLowerCase();

    const credential = await signInWithEmailAndPassword(
      firebaseAuth,
      cleanEmail,
      password
    );

    return {
      success: true,
      firebaseUser: credential.user
    };
  } catch (error: any) {
    return {
      success: false,
      message: getFirebaseAuthErrorMessage(error?.code)
    };
  }
}

export async function firebaseRegisterCustomer(
  name: string,
  email: string,
  password: string
): Promise<{
  success: boolean;
  firebaseUser?: FirebaseUser;
  message?: string;
}> {
  try {
    const cleanEmail = email.trim().toLowerCase();

    const credential = await createUserWithEmailAndPassword(
      firebaseAuth,
      cleanEmail,
      password
    );

    if (name.trim()) {
      await updateProfile(credential.user, {
        displayName: name.trim()
      });
    }

    return {
      success: true,
      firebaseUser: credential.user
    };
  } catch (error: any) {
    return {
      success: false,
      message: getFirebaseAuthErrorMessage(error?.code)
    };
  }
}

export async function firebaseLoginWithGoogle(): Promise<{
  success: boolean;
  firebaseUser?: FirebaseUser;
  message?: string;
}> {
  try {
    const provider = new GoogleAuthProvider();

    provider.setCustomParameters({
      prompt: 'select_account'
    });

    const credential = await signInWithPopup(
      firebaseAuth,
      provider
    );

    return {
      success: true,
      firebaseUser: credential.user
    };
  } catch (error: any) {
    return {
      success: false,
      message: getFirebaseAuthErrorMessage(error?.code)
    };
  }
}

export async function firebaseSendPasswordReset(
  email: string
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const cleanEmail = email.trim().toLowerCase();

    await sendPasswordResetEmail(
      firebaseAuth,
      cleanEmail
    );

    return {
      success: true,
      message:
        'Link de redefinição de senha enviado. Verifique seu e-mail e a caixa de spam.'
    };
  } catch (error: any) {
    return {
      success: false,
      message: getFirebaseAuthErrorMessage(error?.code)
    };
  }
}

export async function firebaseLogout(): Promise<void> {
  await signOut(firebaseAuth);
}

export function subscribeToFirebaseAuthState(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(firebaseAuth, callback);
}
