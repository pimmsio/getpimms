import { DubApiError } from "@/lib/api/errors";
import { withWorkspace } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import {
  capitalize,
  currencyFormatter,
  DUB_WORDMARK,
  formatDate,
} from "@dub/utils";
import {
  Document,
  Image,
  Link,
  Page,
  renderToBuffer,
  Text,
  View,
} from "@react-pdf/renderer";
import { createTw } from "react-pdf-tailwind";
import path from "path";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

const tw = createTw({
  theme: {
    fontFamily: {},
  },
});

export const GET = withWorkspace(async ({ workspace, params, session }) => {
  const { sessionId } = params;

  // Retrieve the checkout session from Stripe
  const checkoutSession = await stripe.checkout.sessions.retrieve(
    sessionId as string,
    {
      expand: ["line_items", "customer"],
    },
  );

  // Get customer ID from checkout session (can be string or expanded Customer object)
  const sessionCustomerId =
    typeof checkoutSession.customer === "string"
      ? checkoutSession.customer
      : checkoutSession.customer?.id;

  // Verify the checkout session belongs to this workspace
  if (
    checkoutSession.client_reference_id !== workspace.id ||
    sessionCustomerId !== workspace.stripeId
  ) {
    throw new DubApiError({
      code: "unauthorized",
      message: "You are not authorized to view this invoice",
    });
  }

  // Verify it's a lifetime deal (mode: "payment")
  if (checkoutSession.mode !== "payment") {
    throw new DubApiError({
      code: "bad_request",
      message: "This is not a lifetime deal invoice",
    });
  }

  // Get customer object (already expanded or retrieve it)
  let customer: Stripe.Customer | null = null;
  if (checkoutSession.customer) {
    if (typeof checkoutSession.customer === "string") {
      try {
        customer = (await stripe.customers.retrieve(
          checkoutSession.customer,
        )) as Stripe.Customer;
      } catch (error) {
        console.error("Error retrieving customer", error);
      }
    } else {
      customer = checkoutSession.customer as Stripe.Customer;
    }
  }

  // Generate invoice number (sequential format for legal compliance)
  const invoiceNumber = `FAC-${new Date(checkoutSession.created * 1000).getFullYear()}-${checkoutSession.id.slice(-8).toUpperCase()}`;
  const invoiceDate = new Date(checkoutSession.created * 1000);
  const amountTotal = checkoutSession.amount_total || 0;
  const currency = (checkoutSession.currency || "eur").toUpperCase();

  // Get line item details
  const lineItem = checkoutSession.line_items?.data[0];
  const description = lineItem?.description || lineItem?.price?.nickname || "PIMMS Lifetime Deal - Accès à vie au plan Pro";

  // Calculate VAT (TVA) - France: 20% for digital services
  // Note: For B2B EU customers, reverse charge may apply
  // For B2C, VAT is included in the Stripe amount
  // Stripe handles VAT automatically, so we need to check if VAT was applied
  const taxAmount = checkoutSession.total_details?.amount_tax || 0;
  const amountHT = amountTotal - taxAmount; // Amount excluding VAT
  const vatRate = taxAmount > 0 ? Math.round((taxAmount / amountHT) * 100) : 0; // Calculate VAT rate

  // Company information for legal compliance in France
  const companyInfo = {
    name: "PIMMS",
    legalForm: "Société", // Adjust based on actual legal form
    address: {
      line1: "c/o ExpertFid & Audit SA, Cours des Bastions 13",
      city: "Genève",
      postalCode: "1205",
      country: "Suisse",
    },
    // Add these if available:
    siret: null, // Add SIRET if company is registered in France
    siren: null, // Add SIREN if company is registered in France
    vatNumber: null, // Add VAT number if applicable (FR + 11 digits)
    rcs: null, // Add RCS registration if applicable
    capital: null, // Add capital if applicable
    email: "alexandre@pimms.io",
    phone: null, // Add phone if available
  };

  const invoiceMetadata = [
    {
      label: "Numéro de facture",
      value: invoiceNumber,
    },
    {
      label: "Date d'émission",
      value: formatDate(invoiceDate, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC",
      }),
    },
    {
      label: "Date d'échéance",
      value: formatDate(invoiceDate, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC",
      }), // Same as issue date for immediate payment
    },
    {
      label: "Type de paiement",
      value: "Paiement unique (Accès à vie)",
    },
  ];

  // Invoice line items with VAT breakdown
  const invoiceLineItems = [
    {
      description: description,
      quantity: 1,
      unitPriceHT: amountHT / 100,
      vatRate: vatRate,
      vatAmount: taxAmount / 100,
      totalHT: amountHT / 100,
      totalTTC: amountTotal / 100,
    },
  ];

  const invoiceSummaryDetails = [
    {
      label: "Total HT",
      value: currencyFormatter(amountHT / 100, {
        currency: currency as "EUR" | "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    },
    ...(taxAmount > 0
      ? [
          {
            label: `TVA (${vatRate}%)`,
            value: currencyFormatter(taxAmount / 100, {
              currency: currency as "EUR" | "USD",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
          },
        ]
      : []),
    {
      label: "Total TTC",
      value: currencyFormatter(amountTotal / 100, {
        currency: currency as "EUR" | "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    },
  ];

  // Seller address (PIMMS)
  const sellerAddress = {
    companyName: companyInfo.name,
    legalForm: companyInfo.legalForm,
    line1: companyInfo.address.line1,
    city: companyInfo.address.city,
    postalCode: companyInfo.address.postalCode,
    country: companyInfo.address.country,
    siret: companyInfo.siret,
    siren: companyInfo.siren,
    vatNumber: companyInfo.vatNumber,
    rcs: companyInfo.rcs,
    capital: companyInfo.capital,
    email: companyInfo.email,
    phone: companyInfo.phone,
  };

  // Buyer address (customer)
  const buyerAddress = {
    companyName: workspace.name,
    name: customer?.shipping?.name || customer?.name || checkoutSession.customer_details?.name || undefined,
    line1: customer?.shipping?.address?.line1 || checkoutSession.customer_details?.address?.line1,
    line2: customer?.shipping?.address?.line2 || checkoutSession.customer_details?.address?.line2,
    city: customer?.shipping?.address?.city || checkoutSession.customer_details?.address?.city,
    state: customer?.shipping?.address?.state || checkoutSession.customer_details?.address?.state,
    postalCode: customer?.shipping?.address?.postal_code || checkoutSession.customer_details?.address?.postal_code,
    country: customer?.shipping?.address?.country || checkoutSession.customer_details?.address?.country,
    email: customer?.email || checkoutSession.customer_details?.email,
    vatNumber: customer?.metadata?.vat_number || checkoutSession.customer_details?.tax_ids?.[0]?.value,
  };

  const pdf = await renderToBuffer(
    <Document>
      <Page size="A4" style={tw("p-12 bg-white")}>
        {/* Header */}
        <View style={tw("flex-row justify-between items-center mb-8")}>
          <Image src={DUB_WORDMARK} style={tw("h-4")} />
          <View style={tw("text-right")}>
            <Text style={tw("text-lg font-bold text-neutral-900")}>
              FACTURE
            </Text>
          </View>
        </View>

        {/* Invoice metadata */}
        <View style={tw("flex-col gap-2 text-sm mb-8")}>
          {invoiceMetadata.map((row) => (
            <View style={tw("flex-row")} key={row.label}>
              <Text style={tw("text-neutral-600 w-1/3 font-medium")}>
                {row.label}:
              </Text>
              <Text style={tw("text-neutral-900 w-2/3")}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Seller and Buyer addresses */}
        <View style={tw("flex-row justify-between mb-8")}>
          {/* Seller (PIMMS) */}
          <View style={tw("w-[48%]")}>
            <Text
              style={tw(
                "text-sm font-bold text-neutral-900 mb-3 border-b border-neutral-300 pb-1",
              )}
            >
              Facturé par
            </Text>
            <Text style={tw("text-sm font-semibold text-neutral-900 mb-1")}>
              {sellerAddress.companyName}
            </Text>
            {sellerAddress.legalForm && (
              <Text style={tw("text-xs text-neutral-600 mb-1")}>
                {sellerAddress.legalForm}
              </Text>
            )}
            <Text style={tw("text-xs text-neutral-700 leading-5")}>
              {sellerAddress.line1}
            </Text>
            <Text style={tw("text-xs text-neutral-700 leading-5")}>
              {sellerAddress.postalCode} {sellerAddress.city}
            </Text>
            <Text style={tw("text-xs text-neutral-700 leading-5")}>
              {sellerAddress.country}
            </Text>
            {sellerAddress.siret && (
              <Text style={tw("text-xs text-neutral-600 mt-2")}>
                SIRET: {sellerAddress.siret}
              </Text>
            )}
            {sellerAddress.siren && (
              <Text style={tw("text-xs text-neutral-600")}>
                SIREN: {sellerAddress.siren}
              </Text>
            )}
            {sellerAddress.vatNumber && (
              <Text style={tw("text-xs text-neutral-600")}>
                TVA: {sellerAddress.vatNumber}
              </Text>
            )}
            {sellerAddress.rcs && (
              <Text style={tw("text-xs text-neutral-600")}>
                RCS: {sellerAddress.rcs}
              </Text>
            )}
            {sellerAddress.capital && (
              <Text style={tw("text-xs text-neutral-600")}>
                Capital: {sellerAddress.capital}
              </Text>
            )}
            {sellerAddress.email && (
              <Text style={tw("text-xs text-neutral-700 mt-2")}>
                {sellerAddress.email}
              </Text>
            )}
            {sellerAddress.phone && (
              <Text style={tw("text-xs text-neutral-700")}>
                {sellerAddress.phone}
              </Text>
            )}
          </View>

          {/* Buyer (Customer) */}
          <View style={tw("w-[48%]")}>
            <Text
              style={tw(
                "text-sm font-bold text-neutral-900 mb-3 border-b border-neutral-300 pb-1",
              )}
            >
              Facturé à
            </Text>
            {buyerAddress.companyName && (
              <Text style={tw("text-sm font-semibold text-neutral-900 mb-1")}>
                {buyerAddress.companyName}
              </Text>
            )}
            {buyerAddress.name && (
              <Text style={tw("text-xs text-neutral-700 leading-5")}>
                {buyerAddress.name}
              </Text>
            )}
            {buyerAddress.line1 && (
              <Text style={tw("text-xs text-neutral-700 leading-5")}>
                {buyerAddress.line1}
              </Text>
            )}
            {buyerAddress.line2 && (
              <Text style={tw("text-xs text-neutral-700 leading-5")}>
                {buyerAddress.line2}
              </Text>
            )}
            {buyerAddress.postalCode && buyerAddress.city && (
              <Text style={tw("text-xs text-neutral-700 leading-5")}>
                {buyerAddress.postalCode} {buyerAddress.city}
              </Text>
            )}
            {buyerAddress.country && (
              <Text style={tw("text-xs text-neutral-700 leading-5")}>
                {buyerAddress.country}
              </Text>
            )}
            {buyerAddress.vatNumber && (
              <Text style={tw("text-xs text-neutral-600 mt-2")}>
                N° TVA: {buyerAddress.vatNumber}
              </Text>
            )}
            {buyerAddress.email && (
              <Text style={tw("text-xs text-neutral-700 mt-2")}>
                {buyerAddress.email}
              </Text>
            )}
          </View>
        </View>

        {/* Line items table */}
        <View style={tw("mb-6 border border-neutral-200 rounded")}>
          <View style={tw("flex-row border-b border-neutral-200 bg-neutral-50")}>
            <Text style={tw("w-[40%] p-3 text-xs font-bold text-neutral-900")}>
              Description
            </Text>
            <Text style={tw("w-[15%] p-3 text-xs font-bold text-neutral-900 text-center")}>
              Qté
            </Text>
            <Text style={tw("w-[15%] p-3 text-xs font-bold text-neutral-900 text-right")}>
              Prix unitaire HT
            </Text>
            {taxAmount > 0 && (
              <Text style={tw("w-[15%] p-3 text-xs font-bold text-neutral-900 text-right")}>
                TVA
              </Text>
            )}
            <Text style={tw("w-[15%] p-3 text-xs font-bold text-neutral-900 text-right")}>
              Total TTC
            </Text>
          </View>

          {invoiceLineItems.map((item, index) => (
            <View
              key={index}
              style={tw(
                `flex-row border-b border-neutral-100 items-start ${index === invoiceLineItems.length - 1 ? "border-b-0" : ""}`,
              )}
            >
              <View style={tw("w-[40%] p-3")}>
                <Text style={tw("text-xs text-neutral-900 leading-5")}>
                  {item.description}
                </Text>
              </View>
              <Text style={tw("w-[15%] p-3 text-xs text-neutral-700 text-center")}>
                {item.quantity}
              </Text>
              <Text style={tw("w-[15%] p-3 text-xs text-neutral-700 text-right")}>
                {currencyFormatter(item.unitPriceHT, {
                  currency: currency as "EUR" | "USD",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
              {taxAmount > 0 && (
                <Text style={tw("w-[15%] p-3 text-xs text-neutral-700 text-right")}>
                  {item.vatRate}%
                </Text>
              )}
              <Text style={tw("w-[15%] p-3 text-xs font-semibold text-neutral-900 text-right")}>
                {currencyFormatter(item.totalTTC, {
                  currency: currency as "EUR" | "USD",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View
          style={tw(
            "flex-col gap-2 mb-6 p-4 border border-neutral-200 rounded bg-neutral-50",
          )}
        >
          {invoiceSummaryDetails.map((row) => (
            <View style={tw("flex-row justify-between")} key={row.label}>
              <Text style={tw("text-sm font-medium text-neutral-700")}>
                {row.label}
              </Text>
              <Text style={tw("text-sm font-bold text-neutral-900")}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Payment information */}
        <View style={tw("mb-6 p-4 border border-neutral-200 rounded")}>
          <Text style={tw("text-xs font-semibold text-neutral-900 mb-2")}>
            Conditions de paiement
          </Text>
          <Text style={tw("text-xs text-neutral-700 leading-5")}>
            Paiement effectué le{" "}
            {formatDate(invoiceDate, {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              timeZone: "UTC",
            })}{" "}
            via Stripe
          </Text>
          <Text style={tw("text-xs text-neutral-700 leading-5")}>
            Statut: Payé
          </Text>
        </View>

        {/* Legal mentions */}
        <View style={tw("mt-6 pt-4 border-t border-neutral-200")}>
          {taxAmount === 0 ? (
            <Text style={tw("text-xs text-neutral-600 leading-5 mb-2")}>
              TVA non applicable, art. 293 B du CGI
            </Text>
          ) : (
            <Text style={tw("text-xs text-neutral-600 leading-5 mb-2")}>
              TVA applicable selon la réglementation en vigueur
            </Text>
          )}
          <Text style={tw("text-xs text-neutral-600 leading-5")}>
            Pour toute question concernant cette facture, veuillez nous contacter
            à{" "}
            <Link href="mailto:alexandre@pimms.io" style={tw("text-neutral-900")}>
              alexandre@pimms.io
            </Link>{" "}
            ou visitez{" "}
            <Link href="https://pimms.io" style={tw("text-neutral-900")}>
              https://pimms.io
            </Link>
          </Text>
        </View>
      </Page>
    </Document>,
  );

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Invoice-${invoiceNumber}.pdf"`,
    },
  });
});
