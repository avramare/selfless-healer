import type { Page } from "@playwright/test";
import type { SelfHeal } from "../../src/self-heal";

/**
 * NOTE: some `primary` selectors below are intentionally STALE (suffixed with
 * "__legacy") to simulate a UI refactor that renamed ids/classes.
 * Each one carries semantic fallbacks, so the self-healing engine recovers the element.
 * The test still passes, while logging a heal so the drift is visible. 
 * The correct selectors are kept in comments to make the demonstration obvious.
 */
export class LoginPage {
    constructor(
        private readonly page: Page,
        private readonly sh: SelfHeal,
    ) { }

    async goto(): Promise<void> {
        await this.page.goto("https://www.saucedemo.com/");
    }

    private usernameField() {
        return this.sh.find({
            key: "login.username",
            primary: "#user-name__legacy", // real selector: #user-name
            intent: "The username input field on the login form",
            fallbacks: { testId: "username", placeholder: "Username" },
        });
    }

    private passwordField() {
        return this.sh.find({
            key: "login.password",
            primary: "#password", // correct → resolves on tier 1, no heal
            intent: "The password input field on the login form",
            fallbacks: { testId: "password", placeholder: "Password" },
        });
    }

    private loginButton() {
        return this.sh.find({
            key: "login.submit",
            primary: ".btn_login--legacy", // real selector: #login-button
            intent: "The login submit button",
            fallbacks: {
                role: { role: "button", name: "Login" },
                testId: "login-button",
            },
        });
    }

    async login(username: string, password: string): Promise<void> {
        await (await this.usernameField()).fill(username);
        await (await this.passwordField()).fill(password);
        await (await this.loginButton()).click();
    }
}
