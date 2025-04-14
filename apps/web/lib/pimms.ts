import { Pimms } from "pimms";

export const pimms = new Pimms({
  token: process.env.PIMMS_API_KEY,
});
// fetch Pimms customer using their external ID (ID in our database)
export const getPimmsCustomer = async (userId: string) => {
  // const customer = await pimms.customers.list({
  //   externalId: userId,
  //   includeExpandedFields: true,
  // });

  // return customer.length > 0 ? customer[0] : null;
  return null;
};
