'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TipTapEditor } from '@/components/tiptap-editor';
import { apiClient } from '@/lib/api-client';

const SETTING_KEY = 'default_rental_terms';

interface SettingResponse {
  key: string;
  value: string;
}

export default function SettingsPage() {
  const [termsHtml, setTermsHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadTerms() {
      try {
        const data = await apiClient<SettingResponse>(`/settings/${SETTING_KEY}`);
        setTermsHtml(data.value);
      } catch {
        // Setting may not exist yet -- start with empty editor
        setTermsHtml('');
      } finally {
        setLoading(false);
      }
    }
    loadTerms();
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await apiClient<SettingResponse>(`/settings/${SETTING_KEY}`, {
        method: 'PUT',
        body: JSON.stringify({ value: termsHtml }),
      });
      toast.success('Warunki najmu zostaly zapisane');
    } catch {
      toast.error('Nie udalo sie zapisac warunkow najmu');
    } finally {
      setSaving(false);
    }
  }, [termsHtml]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display font-semibold text-xl text-charcoal">Ustawienia</h1>
      </div>

      {/* Default rental terms section */}
      <Card>
        <CardHeader>
          <CardTitle>Domyslne warunki najmu</CardTitle>
          <CardDescription>
            Warunki wyswietlane na stronie 2 umowy. Mozna je dostosowac indywidualnie dla kazdego
            wynajmu.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-[300px] w-full" />
            </div>
          ) : (
            <>
              <TipTapEditor content={termsHtml} onChange={setTermsHtml} editable={true} />
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Zapisywanie...' : 'Zapisz'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
