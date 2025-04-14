import { sendEmail } from "@dub/email";
import { FailedPayment } from "@dub/email/templates/failed-payment";
import "dotenv-flow/config";

const attemptCount = 2;
const amountDue = 2400;
const user = {
  name: "Alexandre",
  email: "alexandre.sarfati@gmail.com",
};
const workspace = {
  name: "PIMMS",
  slug: "pimms",
};

async function main() {
  const res = await sendEmail({
    email: user.email as string,
    from: "alexandre@pimms.io",
    subject: `${
      attemptCount == 2
        ? "2nd notice: "
        : attemptCount == 3
          ? "3rd notice: "
          : ""
    }Your payment for PIMMS failed`,
    react: (
      <FailedPayment
        attemptCount={attemptCount}
        amountDue={amountDue}
        user={user}
        workspace={workspace}
      />
    ),
  });

  console.log({ res });
}

main();
