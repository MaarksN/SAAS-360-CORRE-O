# logger-transport-stability

Role: Core structured logger transport shared by API, worker and packages.

Reuses a single pino-pretty transport so runtime logger creation does not add duplicate process exit listeners and destabilize test lanes.
