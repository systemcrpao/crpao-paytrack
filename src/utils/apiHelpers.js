import { ROLES } from '../constants';

export function normalizeRole(role) {
  return String(role || '').trim().toLowerCase();
}

export function normalizeIdentity(value) {
  return String(value || '').trim().toLowerCase();
}

export function isRole(role, expected) {
  return normalizeRole(role) === normalizeRole(expected);
}

export function extractListFromResponse(result) {
  if (Array.isArray(result)) return result;
  if (!result || typeof result !== 'object') return [];

  if (Array.isArray(result.data)) return result.data;
  if (Array.isArray(result.users)) return result.users;
  if (Array.isArray(result.items)) return result.items;

  return [];
}

export function normalizeUser(user) {
  if (!user || typeof user !== 'object') return null;

  const username = user.username || user.userName || user.Username || '';
  const name = user.name || user.Name || username;
  const role = user.role || user.Role || '';

  if (!username) return null;

  return { username, name, role };
}

export function normalizeUsers(users) {
  return extractListFromResponse(users)
    .map(normalizeUser)
    .filter(Boolean);
}

export function getAssigneeUsers(users) {
  return normalizeUsers(users).filter((user) => isRole(user.role, ROLES.USER));
}

export function getUserDisplayName(username, users) {
  if (!username) return '-';

  const matchedUser = normalizeUsers(users).find(
    (user) =>
      user.username === username ||
      normalizeIdentity(user.username) === normalizeIdentity(username) ||
      normalizeIdentity(user.name) === normalizeIdentity(username),
  );

  return matchedUser?.name || username;
}

export function isItemAssignedToUser(item, user, users = []) {
  if (!item || !user) return false;

  const assignee = String(item.assignee || '').trim();
  if (!assignee) return false;

  const username = String(user.username || '').trim();
  const name = String(user.name || '').trim();
  const normalizedAssignee = normalizeIdentity(assignee);

  if (
    assignee === username ||
    (name && assignee === name) ||
    (username && normalizedAssignee === normalizeIdentity(username)) ||
    (name && normalizedAssignee === normalizeIdentity(name))
  ) {
    return true;
  }

  const assigneeUser = normalizeUsers(users).find(
    (entry) =>
      entry.username === assignee ||
      entry.name === assignee ||
      normalizeIdentity(entry.username) === normalizedAssignee ||
      normalizeIdentity(entry.name) === normalizedAssignee,
  );

  return assigneeUser
    ? normalizeIdentity(assigneeUser.username) === normalizeIdentity(username)
    : false;
}
