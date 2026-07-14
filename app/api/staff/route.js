import staffController from '../../../server/controllers/staffController';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = (request) => staffController.list(request);
export const POST = (request) => staffController.create(request);
