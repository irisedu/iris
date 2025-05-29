import { type Router, type Express } from 'express';

export interface BackendFeature {
	name: string;
	setup?: (app: Express) => void;
	routers?: {
		path: string;
		router: Router;
	}[];
}
