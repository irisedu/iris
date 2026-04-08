import swaggerJSDoc from 'swagger-jsdoc';

export default swaggerJSDoc({
	definition: {
		openapi: '3.1.0',
		info: {
			title: 'Iris',
			description:
				'API documentation for Iris, your no-nonsense, open-source CMS. All endpoints should be deemed internal and subject-to-change at any time unless otherwise noted.',
			license: {
				name: 'MIT',
				url: 'https://opensource.org/license/MIT'
			},
			version: '0.0.0'
		}
	},
	apis: ['src/openapi/*.yaml', 'src/*.ts', 'src/features/*/*.ts']
});
