// Root vs pages/ path detection
const isPages = location.pathname.includes('/pages/');
const root = isPages ? '../' : './';

async function requireAuth() {
  const { data: { session } } = await _sb.auth.getSession();
  if (!session) {
    location.href = root + 'index.html';
    return null;
  }
  return session.user;
}

async function requireAdmin() {
  const user = await requireAuth();
  if (!user) return null;
  const { data } = await _sb.from('admin_users').select('email').eq('email', user.email).single();
  if (!data) {
    location.href = root + 'dashboard.html';
    return null;
  }
  return user;
}

async function logout() {
  await _sb.auth.signOut();
  location.href = root + 'index.html';
}

async function getProfile(userId) {
  const { data } = await _sb.from('profiles').select('*').eq('id', userId).single();
  return data;
}

async function updateStreak(userId) {
  const profile = await getProfile(userId);
  const today = new Date().toISOString().split('T')[0];
  const last = profile?.last_log_date;
  let streak = profile?.streak || 0;

  if (last) {
    const diff = Math.floor((new Date(today) - new Date(last)) / 86400000);
    if (diff === 1) streak += 1;
    else if (diff > 1) streak = 1;
  } else {
    streak = 1;
  }

  await _sb.from('profiles').update({ streak, last_log_date: today }).eq('id', userId);
  return streak;
}
