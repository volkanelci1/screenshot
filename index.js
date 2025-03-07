import puppeteer from "puppeteer"
import express from "express"

const app = express()
const PORT = process.env.PORT || 3000

app.get("/screenshot", async (req, res) => {
  const { url } = req.query

  if (!url) {
    return res.status(400).json({ error: "URL is required" })
  }

  try {
    const browser = await puppeteer.launch({
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--headless',
                '--disable-gpu',
                '--window-size=1920x1080'
            ],
            headless: true,
        });
    const page = await browser.newPage()

    // Set viewport to 1920x1080
    await page.setViewport({ width: 1920, height: 1080 })

    // Go to the URL and wait for network to be idle
    await page.goto(url, { waitUntil: "networkidle0", timeout: 0 })

    // Take a screenshot
    const screenshot = await page.screenshot({ encoding: "base64" })

    await browser.close()

    // Send the screenshot as a response
    res.setHeader("Content-Type", "image/png")
    res.send(Buffer.from(screenshot, "base64"))
  } catch (error) {
    console.error("Error:", error)
    res.status(500).json({ error: "Failed to capture screenshot" })
  }
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
