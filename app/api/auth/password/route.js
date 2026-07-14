import authController from '../../../../server/controllers/authController';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const PUT = (request) => authController.changePassword(request);
