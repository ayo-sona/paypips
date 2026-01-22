import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentOrganization = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    if (!request.user.currentOrganization)
      throw new Error('No organization selected');

    return request.user?.currentOrganization;
  },
);
