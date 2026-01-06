import { getCustomerOrThrow } from "@/lib/api/customers/get-customer-or-throw";
import { transformCustomer } from "@/lib/api/customers/transform-customer";
import { DubApiError } from "@/lib/api/errors";
import { parseRequestBody } from "@/lib/api/utils";
import { withWorkspace } from "@/lib/auth";
import {
  CustomerEnrichedSchema,
  CustomerSchema,
  getCustomersQuerySchema,
  updateCustomerBodySchema,
} from "@/lib/zod/schemas/customers";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";

// GET /api/customers/:id – Get a customer by ID
export const GET = withWorkspace(
  async ({ workspace, params, searchParams }) => {
    const { id } = params;
    const { includeExpandedFields: _includeExpandedFields } =
      getCustomersQuerySchema.parse(searchParams);

    const customer = await getCustomerOrThrow(
      {
        id,
        workspaceId: workspace.id,
      },
      {},
    );

    return NextResponse.json(
      CustomerEnrichedSchema.parse(transformCustomer(customer)),
    );
  },
  {
    requiredPlan: ["free", "pro", "business"],
  },
);

// PATCH /api/customers/:id – Update a customer by ID
export const PATCH = withWorkspace(
  async ({ workspace, params, req, searchParams }) => {
    const { id } = params;
    const { includeExpandedFields: _includeExpandedFields } =
      getCustomersQuerySchema.parse(searchParams);

    const { name, email, avatar, externalId } = updateCustomerBodySchema.parse(
      await parseRequestBody(req),
    );

    const customer = await getCustomerOrThrow(
      {
        id,
        workspaceId: workspace.id,
      },
      {},
    );

    try {
      const updatedCustomer = await prisma.customer.update({
        where: {
          id: customer.id,
        },
        data: {
          name,
          email,
          avatar,
          externalId,
        },
      });

      return NextResponse.json(
        CustomerEnrichedSchema.parse(transformCustomer({ ...customer, ...updatedCustomer })),
      );
    } catch (error) {
      if (error.code === "P2002") {
        throw new DubApiError({
          code: "conflict",
          message: "A customer with this external ID already exists.",
        });
      }

      throw new DubApiError({
        code: "unprocessable_entity",
        message: error.message,
      });
    }
  },
  {
    requiredPlan: ["free", "pro", "business"],
  },
);

// DELETE /api/customers/:id – Delete a customer by ID
export const DELETE = withWorkspace(
  async ({ workspace, params }) => {
    const { id } = params;

    const customer = await getCustomerOrThrow({
      id,
      workspaceId: workspace.id,
    });

    await prisma.customer.delete({
      where: {
        id: customer.id,
      },
    });

    return NextResponse.json({
      id: customer.id,
    });
  },
  {
    requiredPlan: ["free", "pro", "business"],
  },
);
