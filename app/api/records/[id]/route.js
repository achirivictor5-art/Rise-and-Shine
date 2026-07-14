import recordController from '../../../../server/controllers/recordController';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const PATCH = (request, { params }) => recordController.update(request, params.id);
export const DELETE = (request, { params }) => recordController.remove(request, params.id);
