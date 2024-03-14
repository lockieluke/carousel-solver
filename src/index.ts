import exitHook from "async-exit-hook";
import puppeteer from "puppeteer-extra";
import AdblockPlugin from "puppeteer-extra-plugin-adblocker";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import {askQuestion, generateCUID} from "./ai.ts";

puppeteer
    .use(AdblockPlugin())
    .use(StealthPlugin());

const QUIZ_URL = Bun.env.QUIZ_URL;
const FIRST_NAME = Bun.env.FIRST_NAME;
const LAST_NAME = Bun.env.LAST_NAME;

if (!QUIZ_URL || !FIRST_NAME || !LAST_NAME) {
    console.error("Missing environment variables");
    process.exit(1);
}

const QUESTION_AI_CUID = await generateCUID();

const prompt = await askQuestion(QUESTION_AI_CUID, "From now on, please answer questions like a UK GCSE Year 11 student, be simple and concise please.  Don't say Hello or anything like that just say the answer.");

const browser = await puppeteer.launch({
    headless: false
});

exitHook(async cb => {
    await browser.close();
    cb();
});

exitHook.unhandledRejectionHandler(async (err, done) => {
    console.error(err);
    await browser.close();
    done();
});

exitHook.uncaughtExceptionHandler(async (err, done) => {
    console.error(err);
    await browser.close();
    done();
});

const page = await browser.newPage();
await page.goto(QUIZ_URL, {
    waitUntil: "domcontentloaded"
});

const solveQuestion = async () => {
    if (page.url() !== `${QUIZ_URL}/test`) {
        console.log("All questions solved");
        return;
    }

    const question = await page.waitForSelector("#quiz-section > div.mt-md > div > div > div > div");
    const questionText: string = await question?.evaluate(el => el.textContent);
    const answerBox = await page.waitForSelector("#answer");
    let answer = await askQuestion(QUESTION_AI_CUID, questionText);
    if (answer.startsWith("Hello! "))
        answer = answer.substring(7);

    const nextButton = await page.waitForSelector("#quiz-section > div.flex.justify-center.my-md > button");

    answerBox?.type(answer);
    await Bun.sleep(100);
    nextButton?.click();
    console.log(`Answered question: ${questionText} with ${answer}`);

    await page.waitForRequest(request => request.url().endsWith("/answer"));
    await solveQuestion();
}

await page.waitForSelector("#root > div.App > div");
const firstNameField = await page.waitForSelector("#firstName");
const lastNameField = await page.waitForSelector("#lastName");

firstNameField?.type(FIRST_NAME);
await Bun.sleep(200);
lastNameField?.type(LAST_NAME);

const submitNameButton = await page.waitForSelector("#student-login > form > button");
submitNameButton?.click();

await page.waitForNavigation();

if (page.url() === `${QUIZ_URL}/test`) {
    console.log("Login Successful");

    await solveQuestion();
} else if (page.url() === `${QUIZ_URL}/marking`) {
    console.log("All questions solved, marking all answers as correct now");

    const markAsCorrect = async () => {
        const correctButton = await page.waitForSelector(atob("I3F1aXotbWFya2luZy1zZWN0aW9uID4gZGl2LmZsZXguZmxleC1jb2wubWRcXDpmbGV4LXJvdy5pdGVtcy1jZW50ZXIuanVzdGlmeS1jZW50ZXIuZ2FwLXhzLm15LW1kID4gYnV0dG9uOm50aC1jaGlsZCgzKQ=="));
        correctButton?.click();
        console.log("Marked as correct");

        await page.waitForRequest(request => request.url().endsWith("/correct"));
        await markAsCorrect();
    }

    await markAsCorrect();
} else {
    console.log("Attempting to retake quiz");
    if (page.url() === `${QUIZ_URL}/test`) {
        console.log("Retaking quiz");

        await solveQuestion();
    }

    const retakeButton = await page.waitForSelector("#root > div.App > div > main > div:nth-child(2) > div > button");
    retakeButton?.click();

    const readyButton = await page.waitForSelector("body > div.ReactModalPortal > div > div > div.flex.justify-center.p-sm.gap-md > button.sc-hKwDye.jRszpq");
    readyButton?.click();

    if (page.url() === `${QUIZ_URL}/test`) {
        console.log("Retaking quiz");

        await solveQuestion();
    } else {
        console.error("Failed to login");
        process.exit(1);
    }
}
