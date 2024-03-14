# Carousel Solver
Automatically solves quizzes on [Carousel Learning](https://www.carousel-learning.com/) using a reverse engineered [QuestionAI](https://www.questionai.com/) API

This project is built with [Bun](https://bun.sh/), to install dependencies:

```bash
bun install
```
<sub>It might take a minute since [Puppeteer](https://pptr.dev/) has to install a special version of Google Chrome</sub>

Pop in your Carousel Learning credentials in a `.env` or simply pass them when you run the program:

```dotenv
# Your quiz URL
QUIZ_URL="https://app.carousel-learning.com/quiz/[uuid]"
# Your Carousel login details
FIRST_NAME="Sherlock"
LAST_NAME="Luk"
```

To run:

```bash
bun start
```

**Quality of answers might vary, don't use it to do your homework, this is highly experimental and only for educational purposes.**
