const common = {
  ip: "0.0.0.0",
  referer: "(direct)",
  qr: 0,
  device: "Desktop",
  browser: "Chrome",
  os: "Mac OS",
};

const pimmsLink = {
  id: "1",
  domain: "pim.ms",
  key: "try",
  shortLink: "https://pim.ms/try",
  url: "https://pimms.io/",
};

const leadLink = {
  id: "3",
  domain: "pim.ms",
  key: "orkester",
  shortLink: "https://pim.ms/orkester",
  url: "https://orkester.fr/",
};

const alexandre = {
  name: "Alexandre Sarfati",
  email: "alexandre@pimms.io",
  avatar: "https://avatar.vercel.sh/s.png?text=S",
};

const jean = {
  name: "Jean Castets",
  email: "jean@orkester.fr",
  avatar: "https://avatar.vercel.sh/t.png?text=T",
};

const chloe = {
  name: "Chloe Dullac",
  email: "chloe@dullac.com",
  avatar: "https://avatar.vercel.sh/k.png?text=K",
};

export const EXAMPLE_EVENTS_DATA = {
  // clicks: [
  //   {
  //     event: "click",
  //     timestamp: new Date().toISOString(),
  //     click: {
  //       id: "1",
  //       country: "US",
  //       city: "San Francisco",
  //       region: "US-CA",
  //       continent: "NA",
  //       ...common,
  //     },
  //     link: pimmsLink,
  //   },
  //   {
  //     event: "click",
  //     timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  //     click: {
  //       id: "2",
  //       country: "US",
  //       city: "New York",
  //       region: "US-NY",
  //       continent: "NA",
  //       ...common,
  //     },
  //     link: pimmsLink,
  //   },
  //   {
  //     event: "click",
  //     timestamp: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
  //     click: {
  //       id: "3",
  //       country: "US",
  //       city: "Pittsburgh",
  //       region: "US-PA",
  //       continent: "NA",
  //       ...common,
  //     },
  //     link: leadLink,
  //   },
  // ],
  leads: [
    {
      event: "lead",
      timestamp: new Date().toISOString(),
      eventId: "YbL8RwLTRRCxQz5H",
      eventName: "Sign up",
      click: {
        id: "1",
        country: "FR",
        city: "Lyon",
        region: "FR-RH",
        continent: "EU",
        ...common,
      },
      link: pimmsLink,
      customer: alexandre,
    },
    {
      event: "lead",
      timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      eventId: "YbL8RwLTRRCxQz5H",
      eventName: "Sign up",
      click: {
        id: "1",
        country: "CH",
        city: "Zurich",
        region: "CH-ZH",
        continent: "EU",
        ...common,
      },
      link: pimmsLink,
      customer: chloe,
    },
    {
      event: "lead",
      timestamp: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
      eventId: "YbL8RwLTRRCxQz5H",
      eventName: "Sign up",
      click: {
        id: "3",
        country: "FR",
        city: "Toulon",
        region: "FR-PAC",
        continent: "EU",
        ...common,
      },
      link: leadLink,
      customer: jean,
    },
  ],
  sales: [
    {
      event: "sale",
      timestamp: new Date().toISOString(),
      eventId: "Nffk2cwShKu5lQ7E",
      eventName: "Purchase",
      sale: {
        amount: 49_90,
        paymentProcessor: "stripe",
        invoiceId: "123456",
      },
      click: {
        id: "1",
        country: "US",
        city: "Lyon",
        region: "FR-RH",
        continent: "EU",
        ...common,
      },
      link: pimmsLink,
      customer: alexandre,
    },
    {
      event: "sale",
      timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      eventId: "Nffk2cwShKu5lQ7E",
      eventName: "Purchase",
      sale: {
        amount: 79_90,
        paymentProcessor: "stripe",
        invoiceId: "123456",
      },
      click: {
        id: "2",
        country: "US",
        city: "Toulon",
        region: "FR-PAC",
        continent: "EU",
        ...common,
      },
      link: pimmsLink,
      customer: jean,
    },
    {
      event: "sale",
      timestamp: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
      eventId: "Nffk2cwShKu5lQ7E",
      eventName: "Purchase",
      sale: {
        amount: 99_90,
        paymentProcessor: "stripe",
        invoiceId: "123456",
      },
      click: {
        id: "3",
        country: "IN",
        city: "Zurich",
        region: "CH-ZH",
        continent: "EU",
        ...common,
      },
      link: pimmsLink,
      customer: chloe,
    },
  ],
};
