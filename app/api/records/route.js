import recordController from '../../../server/controllers/recordController';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = (request) => recordController.list(request);
export const POST = (request) => recordController.create(request);
