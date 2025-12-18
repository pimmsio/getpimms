import { prisma } from "@dub/prisma";
import { OG_AVATAR_URL } from "@dub/utils";
import { DubApiError } from "../errors";
import { CustomerWithLink } from "./transform-customer";

export const getCustomerOrThrow = async (
  {
    id,
    workspaceId,
  }: {
    id: string;
    workspaceId: string;
  },
  _opts: {
    includeExpandedFields?: boolean;
  } = {},
): Promise<CustomerWithLink> => {
  const customer = await prisma.customer.findUnique({
    where: {
      ...(id.startsWith("ext_")
        ? {
            projectId_externalId: {
              projectId: workspaceId,
              externalId: id.replace("ext_", ""),
            },
          }
        : { id }),
    },
    include: {
      link: true,
    },
  });

  if (!customer || customer.projectId !== workspaceId) {
    throw new DubApiError({
      code: "not_found",
      message:
        "Customer not found. Make sure you're using the correct customer ID (e.g. `cus_3TagGjzRzmsFJdH8od2BNCsc`) or external ID (has to be prefixed with `ext_`).",
    });
  }

  if (!customer.avatar) {
    customer.avatar = `${OG_AVATAR_URL}${customer.id}&name=${encodeURIComponent(customer.name || customer.email || '')}`;
  }

  return customer;
};
