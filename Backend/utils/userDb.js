const supabase = require('../supabaseClient');
const {
  withRole,
  USER_BASE_FIELDS,
  USER_FIELDS_WITH_ROLE,
  isMissingRoleColumn,
} = require('./userRole');

async function fetchOne(buildQuery, withRoleField = true) {
  const fields = withRoleField ? USER_FIELDS_WITH_ROLE : USER_BASE_FIELDS;
  let result = await buildQuery(fields).maybeSingle();

  if (result.error && withRoleField && isMissingRoleColumn(result.error)) {
    result = await buildQuery(USER_BASE_FIELDS).maybeSingle();
  }

  return result;
}

async function selectUsersList() {
  let result = await supabase
    .from('users')
    .select(USER_FIELDS_WITH_ROLE)
    .order('created_at', { ascending: false });

  if (result.error && isMissingRoleColumn(result.error)) {
    result = await supabase
      .from('users')
      .select(USER_BASE_FIELDS)
      .order('created_at', { ascending: false });
  }

  return result;
}

async function getUserById(id) {
  const { data, error } = await fetchOne(
    (fields) => supabase.from('users').select(fields).eq('id', id),
  );
  if (error) return { data: null, error };
  return { data: data ? withRole(data) : null, error: null };
}

async function getUserByEmail(email) {
  const { data, error } = await fetchOne(
    (fields) => supabase.from('users').select(fields).eq('email', email.toLowerCase()),
  );
  if (error) return { data: null, error };
  return { data: data ? withRole(data) : null, error: null };
}

async function insertUser(payload) {
  let result = await supabase
    .from('users')
    .insert(payload)
    .select(USER_FIELDS_WITH_ROLE)
    .single();

  if (result.error && isMissingRoleColumn(result.error)) {
    result = await supabase
      .from('users')
      .insert(payload)
      .select(USER_BASE_FIELDS)
      .single();
  }

  return result;
}

async function updateUser(id, payload) {
  let result = await supabase
    .from('users')
    .update(payload)
    .eq('id', id)
    .select(USER_FIELDS_WITH_ROLE)
    .single();

  if (result.error && isMissingRoleColumn(result.error)) {
    result = await supabase
      .from('users')
      .update(payload)
      .eq('id', id)
      .select(USER_BASE_FIELDS)
      .single();
  }

  return result;
}

module.exports = {
  selectUsersList,
  getUserById,
  getUserByEmail,
  insertUser,
  updateUser,
  withRoleFromDb: withRole,
};
