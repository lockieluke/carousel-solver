import * as os from "os";

export async function askQuestion(cuid: string, prompt: string) {
    const response = await fetch(`https://www.questionai.com/questionai/chat/ask?appId=aihomework&clientType=2&presetId=92&lang=en&cuid=${cuid}&vc=270&msgCategory=200&content=${encodeURIComponent(prompt)}`, {
        "headers": {
            "Dnt": "1"
        }
    });
    if (!response.ok) {
        throw new Error("Failed to ask question");
    }

    // read event stream and return response
    const reader = response.body?.getReader();
    let decoder = new TextDecoder();
    let result = "";
    let done = false;
    while (!done) {
        const decoded = await reader?.read();
        if (!decoded)
            break;

        let value: string = decoder.decode(decoded.value, { stream: true });
        if (value) {
            if (value.startsWith("event:finish"))
                done = true;
            else if (value.startsWith("event:notification")) {
                value = value.split(os.EOL)[1];
                value = value.substring(5);

                const text = JSON.parse(value)["text"];
                if (text)
                    result += text;
            }
        }
    }

    return result;
}

export async function generateCUID(): Promise<string> {
    const response = await fetch("https://www.questionai.com/questionai/common/genCuid", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(Object.assign({
            cuid: "start",
            uuid: crypto.randomUUID()
        }))
    });
    if (!response.ok) {
        throw new Error("Failed to generate Question AI CUID");
    }
    const json: any = await response.json();

    return json["data"]["cuid"];
}
