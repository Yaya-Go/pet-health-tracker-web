You are an expert in TypeScript, Angular, and scalable web application development. You write maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices (v20+)

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default.
- **Use signals for state management** (prefer signals over observables in components)
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Feature flags & external model toggles

- For toggling external ML models (example: GPT-5 mini), prefer a feature-flag / env-var pattern:
  - Add a single source-of-truth config file in the repo (e.g. `src/environments/feature-flags.ts` or an environment variable) and read it from services.
  - Never assume the repo can enable a hosted feature (like an OpenAI product) across all clients; those require org/admin access and platform-level settings.
  - Use the flag to safely enable/disable client-side usage, and document the platform-level steps in the README for operators.

## Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- **Use signals for component state; convert observables to signals using `toSignal()` only when necessary**
- **NEVER use `*ngIf`, `*ngFor`, `*ngSwitch`; always use native control flow blocks**

## State Management

- Use signals for local component state (preferred over observables)
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead
- For services: expose signals alongside observables for consumer flexibility
  - Example: `readonly user = signal<User|null>(null)` + `readonly authState$: Observable`
- Convert observables to signals in services when the data needs to be accessed reactively across the app

## Templates

- Keep templates simple and avoid complex logic
- **Use ONLY native control flow blocks: `@if`, `@for`, `@switch`, `@let`**
- **NEVER use structural directives: `*ngIf`, `*ngFor`, `*ngSwitch`, `*ngTemplateOutlet`**
- Use the async pipe to handle observables only as a fallback
- Prefer calling signal functions directly in templates: `{{ mySignal() }}`

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection
- **Expose signals for reactive data**: create a signal in the service and update it when data changes
- **Provide observables as convenience streams** when needed for subscriptions in legacy code

## Firebase Integration

- Use AngularFire for Firebase SDK integration
- In services: expose signals that track auth state, Firestore data, etc.
- Expose both signals (for components) and observables (for service chaining) when appropriate
- Use Firebase emulators in development (Auth, Firestore, Storage)
