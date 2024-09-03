import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import parse from 'html-react-parser';

function SanitizedHtml({ html }: { html: string }) {
	const htmlSanitized = useMemo(() => DOMPurify.sanitize(html), [html]);
	return parse(htmlSanitized);
}

export default SanitizedHtml;
