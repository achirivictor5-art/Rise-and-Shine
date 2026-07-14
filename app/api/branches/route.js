import branchController from '../../../server/controllers/branchController';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = (request) => branchController.list(request);
