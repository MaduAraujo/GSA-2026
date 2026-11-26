import { Router } from 'express';
import { z } from 'zod';
import { adminClient } from '../config.js';
import { HttpError, parseBody, requireAuth } from '../http.js';

export const ACCOUNT_DELETE_CONFIRMATION = 'EXCLUIR';

const USER_BUCKETS = ['user-files', 'prompt-docs'] as const;
const LIST_PAGE_SIZE = 1000;
const REMOVE_BATCH_SIZE = 100;

const deleteAccountSchema = z.object({
  confirmation: z.literal(ACCOUNT_DELETE_CONFIRMATION, {
    error: `Digite ${ACCOUNT_DELETE_CONFIRMATION} para confirmar a exclusão.`,
  }),
});

type Admin = NonNullable<typeof adminClient>;

async function listFilesRecursively(admin: Admin, bucket: string, prefix: string): Promise<string[]> {
  const files: string[] = [];
  for (let offset = 0; ; offset += LIST_PAGE_SIZE) {
    const { data, error } = await admin.storage.from(bucket).list(prefix, { limit: LIST_PAGE_SIZE, offset });
    if (error) throw error;
    if (!data?.length) break;
    for (const entry of data) {
      const path = `${prefix}/${entry.name}`;
      if (entry.id === null) {
        files.push(...(await listFilesRecursively(admin, bucket, path)));
      } else {
        files.push(path);
      }
    }
    if (data.length < LIST_PAGE_SIZE) break;
  }
  return files;
}

async function removeUserFiles(admin: Admin, userId: string): Promise<void> {
  for (const bucket of USER_BUCKETS) {
    const paths = await listFilesRecursively(admin, bucket, userId);
    for (let i = 0; i < paths.length; i += REMOVE_BATCH_SIZE) {
      const { error } = await admin.storage.from(bucket).remove(paths.slice(i, i + REMOVE_BATCH_SIZE));
      if (error) throw error;
    }
  }
}

export const accountRouter = Router();

accountRouter.delete('/', requireAuth, async (req, res) => {
  if (!adminClient) {
    throw new HttpError(503, 'Exclusão de conta indisponível (SUPABASE_SERVICE_ROLE_KEY ausente).');
  }
  parseBody(req, deleteAccountSchema);
  const userId = req.userId!;

  await removeUserFiles(adminClient, userId);

  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) throw error;

  res.status(204).end();
});
