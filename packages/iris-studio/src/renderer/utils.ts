export function cmdOrCtrl(e: { metaKey: boolean; ctrlKey: boolean }) {
	return os.platform === 'darwin' ? e.metaKey : e.ctrlKey;
}
