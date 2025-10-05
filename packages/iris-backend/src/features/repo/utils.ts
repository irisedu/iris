import { db } from '../../db/index.js';

export async function getUserWorkspaceGroup(uid: string, wid: string) {
	return (
		await db
			.selectFrom('repo_workspace_group')
			.where('workspace_id', '=', wid)
			.where('user_id', '=', uid)
			.select('group_name')
			.executeTakeFirst()
	)?.group_name;
}
