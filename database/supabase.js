import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { createClient, processLock } from '@supabase/supabase-js';

WebBrowser.maybeCompleteAuthSession();

const expoExtra =
  Constants.expoConfig?.extra ||
  Constants.manifest?.extra ||
  Constants.manifest2?.extra ||
  {};

const APP_SCHEME = expoExtra.APP_SCHEME || 'taskhub';
const GOOGLE_PROVIDER_TOKEN_KEY = '@taskhub/google_provider_token';
const GOOGLE_PROVIDER_REFRESH_TOKEN_KEY = '@taskhub/google_provider_refresh_token';
const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const isExpoGo = Constants.appOwnership === 'expo';
const redirectTo = makeRedirectUri(
  isExpoGo
    ? {
        path: 'auth/callback',
      }
    : {
        scheme: APP_SCHEME,
        path: 'auth/callback',
      },
);

// Prioriza config do Expo e variáveis de ambiente antes do fallback local.
const SUPABASE_URL = expoExtra.SUPABASE_URL || process.env.SUPABASE_URL || 'https://kncfgepymkgnccjcjxgv.supabase.co';
const SUPABASE_ANON_KEY = expoExtra.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuY2ZnZXB5bWtnbmNjamNqeGd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMTYxOTgsImV4cCI6MjA5MTY5MjE5OH0.GkNK9smu6_g5HED8QVABVn5OghS-n9fvfHU0h8GQALU';

const mapDbEventToAppEvent = (row) => ({
  id: row.id,
  name: row.name,
  date: row.date,
  startTime: row.starttime ?? row.startTime ?? null,
  endTime: row.endtime ?? row.endTime ?? null,
  location: row.location,
  organizer: row.organizer,
  description: row.description,
  userId: row.user_id ?? null,
  insertedAt: row.inserted_at ?? null,
});

const mapAppEventToDbEvent = (event) => ({
  name: event.name || null,
  date: event.date || null,
  starttime: event.startTime || event.starttime || null,
  endtime: event.endTime || event.endtime || null,
  location: event.location || null,
  organizer: event.organizer || null,
  description: event.description || null,
});

const mapOwnedAppEventToDbEvent = (userId, event) => ({
  ...mapAppEventToDbEvent(event),
  user_id: userId,
});

const mapDbUserToAppUser = (row) => ({
  id: row.id,
  name: row.name ?? row.full_name ?? '',
  email: row.email,
  password: row.password ?? '',
  provider: row.provider ?? 'email',
  providerId: row.provider_id ?? null,
  avatarUrl: row.avatar_url ?? null,
  insertedAt: row.inserted_at ?? null,
});

const mapAppUserToDbUser = (user) => ({
  id: user.id,
  name: user.name || null,
  email: user.email ? user.email.trim().toLowerCase() : null,
  password: user.password || null,
  provider: user.provider || 'email',
  provider_id: user.providerId || null,
  avatar_url: user.avatarUrl || null,
});

const getGoogleIdentity = (user) => {
  if (!user?.identities || !Array.isArray(user.identities)) return null;
  return user.identities.find((identity) => identity.provider === 'google') || null;
};

const isGoogleProviderUser = (user) => {
  if (!user) {
    return false;
  }

  if (getGoogleIdentity(user)) {
    return true;
  }

  if (user.app_metadata?.provider === 'google') {
    return true;
  }

  if (Array.isArray(user.app_metadata?.providers) && user.app_metadata.providers.includes('google')) {
    return true;
  }

  if (user.user_metadata?.provider === 'google') {
    return true;
  }

  return false;
};

const upsertUserProfile = async (profile) => {
  if (!supabase) return { data: null, error: new Error('Supabase nao configurado.') };

  const { data, error } = await supabase
    .from('users')
    .upsert([mapAppUserToDbUser(profile)], { onConflict: 'id' })
    .select();

  return {
    data: Array.isArray(data) ? data.map(mapDbUserToAppUser) : data,
    error,
  };
};

const storeGoogleTokens = async (session) => {
  try {
    if (session?.provider_token) {
      await AsyncStorage.setItem(GOOGLE_PROVIDER_TOKEN_KEY, session.provider_token);
    }

    if (session?.provider_refresh_token) {
      await AsyncStorage.setItem(GOOGLE_PROVIDER_REFRESH_TOKEN_KEY, session.provider_refresh_token);
    }
  } catch (e) {
    console.error('Erro ao salvar os tokens do Google: ', e);
  }
};

const clearGoogleTokens = async () => {
  try {
    await AsyncStorage.multiRemove([GOOGLE_PROVIDER_TOKEN_KEY, GOOGLE_PROVIDER_REFRESH_TOKEN_KEY]);
  } catch (e) {
    console.error('Erro ao limpar os tokens do Google: ', e);
  }
};

export const getStoredGoogleTokens = async () => {
  try {
    const [providerToken, providerRefreshToken] = await AsyncStorage.multiGet([
      GOOGLE_PROVIDER_TOKEN_KEY,
      GOOGLE_PROVIDER_REFRESH_TOKEN_KEY,
    ]);

    return {
      providerToken: providerToken?.[1] || null,
      providerRefreshToken: providerRefreshToken?.[1] || null,
    };
  } catch (e) {
    console.error('Erro ao carregar os tokens do Google: ', e);
    return {
      providerToken: null,
      providerRefreshToken: null,
    };
  }
};

export const syncUserProfileFromSession = async (session) => {
  const activeSession = session || (await supabase?.auth.getSession())?.data?.session;

  if (!activeSession?.user) {
    return { data: null, error: null };
  }

  const authUser = activeSession.user;
  const googleIdentity = getGoogleIdentity(authUser);
  const provider = googleIdentity ? 'google' : authUser.app_metadata?.provider || 'email';
  const metadata = authUser.user_metadata || {};

  await storeGoogleTokens(activeSession);

  return upsertUserProfile({
    id: authUser.id,
    name:
      metadata.name ||
      metadata.full_name ||
      metadata.user_name ||
      authUser.email?.split('@')[0] ||
      'Usuário',
    email: authUser.email || null,
    password: null,
    provider,
    providerId: googleIdentity?.id || null,
    avatarUrl: metadata.avatar_url || metadata.picture || null,
  });
};

const createSessionFromUrl = async (url) => {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) {
    throw new Error(errorCode);
  }

  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;
  const providerToken = params.provider_token;
  const providerRefreshToken = params.provider_refresh_token;

  if (!accessToken || !refreshToken) {
    return null;
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    throw error;
  }

  if (providerToken || providerRefreshToken) {
    await storeGoogleTokens({
      provider_token: providerToken,
      provider_refresh_token: providerRefreshToken,
    });
  }

  await storeGoogleTokens(data.session);
  await syncUserProfileFromSession(data.session);
  return data.session;
};

const getAuthenticatedUserId = async () => {
  if (!supabase) {
    return { userId: null, error: new Error('Supabase nao configurado.') };
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    return { userId: null, error };
  }

  if (!session?.user?.id) {
    return { userId: null, error: new Error('Faça login para acessar seus eventos.') };
  }

  return { userId: session.user.id, error: null };
};

let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  });
} else {
}

if (supabase && !globalThis.__taskhubAutoRefreshBound) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });

  globalThis.__taskhubAutoRefreshBound = true;
}

export { supabase };
export const googleAuthRedirectUrl = redirectTo;

export const getCurrentSession = async () => {
  if (!supabase) return { session: null, error: new Error('Supabase nao configurado.') };
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  return { session, error };
};

export const getCurrentUserProfile = async () => {
  if (!supabase) return { user: null, error: new Error('Supabase nao configurado.') };

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    return { user: null, error: sessionError };
  }

  if (!session?.user?.id) {
    return { user: null, error: null };
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();

  return {
    user: data ? mapDbUserToAppUser(data) : null,
    error,
  };
};

export const signUpWithEmailPassword = async ({ name, email, password }) => {
  if (!supabase) return { data: null, error: new Error('Supabase nao configurado.') };

  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        name: name.trim(),
      },
    },
  });

  if (error) {
    return { data: null, error };
  }

  if (data?.user) {
    await upsertUserProfile({
      id: data.user.id,
      name: name.trim(),
      email: normalizedEmail,
      password: null,
      provider: 'email',
      providerId: null,
      avatarUrl: null,
    });
  }

  return { data, error: null };
};

export const signInWithEmailPassword = async ({ email, password }) => {
  if (!supabase) return { data: null, error: new Error('Supabase nao configurado.') };

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    return { data: null, error };
  }

  await syncUserProfileFromSession(data.session);
  return { data, error: null };
};

export const signInWithGoogle = async () => {
  if (!supabase) return { session: null, error: new Error('Supabase nao configurado.') };

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      scopes: `openid email profile ${GOOGLE_CALENDAR_SCOPE}`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    return { session: null, error };
  }

  const authSessionResult = await WebBrowser.openAuthSessionAsync(data?.url ?? '', redirectTo);

  if (authSessionResult.type === 'success') {
    const session = await createSessionFromUrl(authSessionResult.url);
    return { session, error: null };
  }

  if (authSessionResult.type === 'cancel' || authSessionResult.type === 'dismiss') {
    return { session: null, error: new Error('Login com Google cancelado.') };
  }

  return { session: null, error: new Error('Nao foi possivel concluir o login com Google.') };
};

export const signOutFromSupabase = async () => {
  if (!supabase) return { error: new Error('Supabase nao configurado.') };

  const { error } = await supabase.auth.signOut();
  await clearGoogleTokens();
  return { error };
};

export const getEventsFromSupabase = async () => {
  if (!supabase) return { data: null, error: new Error('Supabase nao configurado.') };

  const { userId, error: userError } = await getAuthenticatedUserId();
  if (userError) {
    return { data: null, error: userError };
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true })
    .order('starttime', { ascending: true });

  return {
    data: Array.isArray(data) ? data.map(mapDbEventToAppEvent) : data,
    error,
  };
};

export const insertEventToSupabase = async (event) => {
  if (!supabase) return { data: null, error: new Error('Supabase nao configurado.') };

  const { userId, error: userError } = await getAuthenticatedUserId();
  if (userError) {
    return { data: null, error: userError };
  }

  const { data, error } = await supabase
    .from('events')
    .insert([mapOwnedAppEventToDbEvent(userId, event)])
    .select();

  return {
    data: Array.isArray(data) ? data.map(mapDbEventToAppEvent) : data,
    error,
  };
};

export const updateEventInSupabase = async (eventId, event) => {
  if (!supabase) return { data: null, error: new Error('Supabase nao configurado.') };

  const { userId, error: userError } = await getAuthenticatedUserId();
  if (userError) {
    return { data: null, error: userError };
  }

  const { data, error } = await supabase
    .from('events')
    .update(mapOwnedAppEventToDbEvent(userId, event))
    .eq('id', eventId)
    .eq('user_id', userId)
    .select();

  return {
    data: Array.isArray(data) ? data.map(mapDbEventToAppEvent) : data,
    error,
  };
};

export const deleteEventFromSupabase = async (eventId) => {
  if (!supabase) return { error: new Error('Supabase nao configurado.') };

  const { userId, error: userError } = await getAuthenticatedUserId();
  if (userError) {
    return { error: userError };
  }

  const { error } = await supabase.from('events').delete().eq('id', eventId).eq('user_id', userId);
  return { error };
};

export const exportEventToGoogleCalendar = async (event) => {
  if (!supabase) return { data: null, error: new Error('Supabase nao configurado.') };

  if (!event?.date || !event?.startTime || !event?.endTime) {
    return {
      data: null,
      error: new Error('O evento precisa ter data, hora de início e hora de término para ser exportado.'),
    };
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    return { data: null, error: sessionError };
  }

  const storedTokens = await getStoredGoogleTokens();
  const googleToken = session?.provider_token || storedTokens.providerToken;
  const hasGoogleProvider = isGoogleProviderUser(session?.user);

  if (!hasGoogleProvider) {
    return {
      data: null,
      error: new Error('Entre com Google para exportar eventos para o Google Calendar.'),
    };
  }

  if (!googleToken) {
    return {
      data: null,
      error: new Error('A sessão Google não trouxe permissão do Calendar. Entre novamente com Google para renovar o acesso.'),
    };
  }

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const startDateTime = new Date(`${event.date}T${event.startTime}:00`);
  const endDateTime = new Date(`${event.date}T${event.endTime}:00`);

  if (Number.isNaN(startDateTime.getTime()) || Number.isNaN(endDateTime.getTime())) {
    return {
      data: null,
      error: new Error('O evento possui data ou horário inválido para exportação.'),
    };
  }

  const payload = {
    summary: event.name,
    location: event.location || undefined,
    description: [event.description, event.organizer ? `Organizador: ${event.organizer}` : null]
      .filter(Boolean)
      .join('\n\n'),
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone,
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone,
    },
  };

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${googleToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      data: null,
      error: new Error(
        responseData?.error?.message || 'Nao foi possivel exportar o evento para o Google Calendar.',
      ),
    };
  }

  return { data: responseData, error: null };
};

export const exportEventsToGoogleCalendar = async (events) => {
  if (!Array.isArray(events) || events.length === 0) {
    return {
      successCount: 0,
      failedCount: 0,
      results: [],
      error: new Error('Nenhum evento foi informado para exportacao.'),
    };
  }

  const results = [];

  for (const event of events) {
    const result = await exportEventToGoogleCalendar(event);
    results.push({
      eventId: event.id,
      eventName: event.name,
      ...result,
    });

    if (result.error && result.error.message === 'Entre com Google para exportar eventos para o Google Calendar.') {
      return {
        successCount: 0,
        failedCount: events.length,
        results,
        error: result.error,
      };
    }
  }

  const successCount = results.filter((result) => !result.error).length;
  const failedCount = results.length - successCount;

  return {
    successCount,
    failedCount,
    results,
    error: null,
  };
};

export const migrateEventsToSupabase = async () => {
  if (!supabase) return { data: null, error: new Error('Supabase nao configurado.') };
  try {
    const { userId, error: userError } = await getAuthenticatedUserId();
    if (userError) {
      return { data: null, error: userError };
    }

    const stored = await AsyncStorage.getItem('events');
    const events = stored ? JSON.parse(stored) : [];
    if (!events || events.length === 0) return { inserted: 0 };

    const rows = events.map((event) => mapOwnedAppEventToDbEvent(userId, event));

    const { data, error } = await supabase.from('events').insert(rows).select();
    return {
      data: Array.isArray(data) ? data.map(mapDbEventToAppEvent) : data,
      error,
    };
  } catch (e) {
    return { data: null, error: e };
  }
};

export default {
  supabase,
  getCurrentSession,
  getCurrentUserProfile,
  signUpWithEmailPassword,
  signInWithEmailPassword,
  signInWithGoogle,
  signOutFromSupabase,
  syncUserProfileFromSession,
  getEventsFromSupabase,
  insertEventToSupabase,
  updateEventInSupabase,
  deleteEventFromSupabase,
  exportEventToGoogleCalendar,
  exportEventsToGoogleCalendar,
  migrateEventsToSupabase,
};
