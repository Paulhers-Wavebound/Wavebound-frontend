import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { callAdminData } from '@/utils/adminData';

export function useLabelRole() {
  const [isLabel, setIsLabel] = useState(false);
  const [loading, setLoading] = useState(true);
  const initialCheckDone = useRef(false);

  useEffect(() => {
    const checkLabelRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (!initialCheckDone.current) setIsLabel(false);
          setLoading(false);
          initialCheckDone.current = true;
          return;
        }

        // Check user_profiles.label_id instead of role-based check
        const { data, error } = await supabase.from('user_profiles')
          .select('label_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking label role:', error);
          if (!initialCheckDone.current) setIsLabel(false);
        } else if (data?.label_id) {
          setIsLabel(true);
        } else {
          // Admin users without a label_id still get label portal access
          try {
            const adminRes = await callAdminData('check_admin');
            setIsLabel(!!adminRes?.is_admin);
          } catch {
            setIsLabel(false);
          }
        }
      } catch (error) {
        console.error('Error in label check:', error);
        if (!initialCheckDone.current) setIsLabel(false);
      } finally {
        setLoading(false);
        initialCheckDone.current = true;
      }
    };

    checkLabelRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkLabelRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { isLabel, loading };
}
