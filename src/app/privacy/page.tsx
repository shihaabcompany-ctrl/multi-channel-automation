export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">
        Privacy Policy
      </h1>

      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: June 23, 2026
      </p>

      <div className="mt-8 space-y-6 text-sm leading-7 text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">
            1. Overview
          </h2>
          <p>
            Zyrelo is a multi-channel automation platform that helps businesses
            manage contacts, media, messages, scheduled campaigns, and delivery
            activity across supported communication channels.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            2. Information We Collect
          </h2>
          <p>
            We may collect account information, company information, contact
            details uploaded by users, campaign content, media files, delivery
            logs, connection settings, and messages received through connected
            channels.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            3. How We Use Information
          </h2>
          <p>
            We use information to provide the platform, send or schedule
            messages requested by users, manage contacts and groups, display
            inbox and delivery history, secure accounts, and improve reliability.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            4. Third-Party Platforms
          </h2>
          <p>
            When users connect third-party platforms such as WhatsApp,
            Instagram, Facebook, LinkedIn, email, or SMS providers, Zyrelo uses
            the authorized connection only to perform actions requested by the
            user, such as sending messages, publishing content, or receiving
            replies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            5. Data Sharing
          </h2>
          <p>
            We do not sell personal information. Data may be shared with service
            providers only as needed to operate the platform, such as hosting,
            storage, messaging, analytics, security, or connected communication
            APIs.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            6. Data Security
          </h2>
          <p>
            We use reasonable technical and organizational measures to protect
            data, including access controls, secure storage, and encryption for
            sensitive platform connection tokens where applicable.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            7. Data Retention
          </h2>
          <p>
            We retain data for as long as needed to provide the platform,
            comply with legal obligations, resolve disputes, and maintain
            business records, unless deletion is requested and legally
            permitted.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            8. Contact
          </h2>
          <p>
            For privacy questions, contact us at:
            {" "}
            <a className="text-primary underline" href="mailto:privacy@zyrelo.com">
              privacy@zyrelo.com
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}