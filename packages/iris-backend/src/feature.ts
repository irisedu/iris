import { type Router, type Express } from 'express';

export interface BackendFeature {
	name: string;
	setup?: (app: Express) => Promise<void> | void;
	routers?: {
		path: string;
		router: Router;
	}[];
}
