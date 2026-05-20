import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import useAuth from './useAuth';

const NODE_ENV = ((globalThis as any).process?.env?.NODE_ENV as string | undefined) || '';
const HOSTNAME = typeof window !== 'undefined' ? window.location.hostname : '';
const IS_DEV = NODE_ENV === 'development' || HOSTNAME === 'localhost' || HOSTNAME === '127.0.0.1';

interface ProfileViewContext {
  effectiveUserId: string | null;
  authUserId: string | null;
  loading: boolean;
  isAdmin: boolean;
  isImpersonating: boolean;
  isReadonlyView: boolean;
  isDevMode: boolean;
}

export default function useProfileViewContext(): ProfileViewContext {
  const user = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [effectiveUserId, setEffectiveUserId] = useState<string | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const previewUserId = params.get('asUser');
  const devPreviewFlag = params.get('devPreview') === '1';

  useEffect(() => {
    const resolveView = async () => {
      if (!user) {
        setIsAdmin(false);
        setEffectiveUserId(null);
        setIsImpersonating(false);
        setLoading(false);
        return;
      }

      const defaultId = user.uid;
      const wantsPreview = Boolean(previewUserId && devPreviewFlag);

      try {
        const adminDoc = await getDoc(doc(db, 'users', defaultId));
        const isAdminUser = adminDoc.exists() && adminDoc.data().isAdmin === true;
        setIsAdmin(isAdminUser);

        if (!IS_DEV || !wantsPreview || previewUserId === defaultId) {
          setEffectiveUserId(defaultId);
          setIsImpersonating(false);
          return;
        }

        if (isAdminUser) {
          setEffectiveUserId(previewUserId);
          setIsImpersonating(true);
        } else {
          setEffectiveUserId(defaultId);
          setIsImpersonating(false);
        }
      } catch {
        setIsAdmin(false);
        setEffectiveUserId(defaultId);
        setIsImpersonating(false);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    resolveView();
  }, [user, previewUserId, devPreviewFlag]);

  return {
    effectiveUserId,
    authUserId: user?.uid || null,
    loading,
    isAdmin,
    isImpersonating,
    isReadonlyView: isImpersonating,
    isDevMode: IS_DEV,
  };
}
