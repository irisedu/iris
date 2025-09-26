import { objLogger } from '../../logger.js';
import { type BackendFeature } from '../../feature.js';
import {
	S3Client,
	CreateBucketCommand,
	BucketAlreadyOwnedByYou,
	type CreateBucketCommandInput,
	PutBucketPolicyCommand,
	PutBucketCorsCommand,
	S3ServiceException
} from '@aws-sdk/client-s3';

export const s3Client = new S3Client({
	forcePathStyle: process.env.AWS_FORCE_PATH_STYLE === '1'
});

export async function ensureBucket(
	name: string,
	pub: boolean,
	opts: Omit<CreateBucketCommandInput, 'Bucket'> = {}
) {
	objLogger.info(`Ensuring bucket ${name} (public: ${pub})...`);

	try {
		await s3Client.send(
			new CreateBucketCommand({
				Bucket: name,
				...opts
			})
		);
	} catch (e: unknown) {
		if (e instanceof BucketAlreadyOwnedByYou) {
			// OK
			objLogger.info(`Bucket ${name} already exists`);
		} else {
			throw e;
		}
	}

	if (pub) {
		objLogger.info(`Setting public bucket policy for bucket ${name}...`);
		await s3Client.send(
			new PutBucketPolicyCommand({
				Policy: JSON.stringify({
					Version: '2012-10-17',
					Statement: [
						{
							Effect: 'Allow',
							Principal: '*',
							Action: ['s3:GetObject'],
							Resource: `arn:aws:s3:::${name}/*`
						}
					]
				}),
				Bucket: name
			})
		);
	}

	objLogger.info(`Setting CORS rules for bucket ${name}...`);
	try {
		await s3Client.send(
			new PutBucketCorsCommand({
				Bucket: name,
				CORSConfiguration: {
					CORSRules: [
						{
							AllowedHeaders: ['*'],
							AllowedMethods: ['GET', 'PUT'],
							AllowedOrigins: [process.env.BASE_URL!],
							ExposeHeaders: ['ETag'],
							MaxAgeSeconds: 3600
						}
					]
				}
			})
		);
	} catch (e: unknown) {
		if (e instanceof S3ServiceException && e.name === 'NotImplemented') {
			objLogger.info('CORS is not implemented.');
		}
	}
}

export const objFeature = {
	name: 'obj'
} satisfies BackendFeature;
