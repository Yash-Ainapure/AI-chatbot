'use client'

import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function ScrapePage() {
    const [status, setStatus] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)
    const [urlsScraped, setUrlsScraped] = useState<string[]>([])

    const handleScrape = async () => {
        try {
            setIsLoading(true)
            setStatus('Starting website scrape...')
            setUrlsScraped([])
            
            const response = await fetch('/api/scrape')
            const data = await response.json()
            
            if (response.ok) {
                setStatus('Successfully scraped website!')
                setUrlsScraped(data.urlsScraped || [])
            } else {
                setStatus(`Error: ${data.error}`)
            }
        } catch (error) {
            setStatus('Failed to scrape website')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Website Scraper</h1>
            
            <Button 
                onClick={handleScrape}
                disabled={isLoading}
                className="mb-4"
            >
                {isLoading ? 'Scraping...' : 'Start Scraping'}
            </Button>

            {status && (
                <div className="p-4 rounded bg-muted mb-4">
                    <p>{status}</p>
                </div>
            )}

            {urlsScraped.length > 0 && (
                <div className="mt-4">
                    <h2 className="text-xl font-semibold mb-2">Pages Scraped:</h2>
                    <ul className="list-disc pl-5">
                        {urlsScraped.map((url, index) => (
                            <li key={index} className="text-sm text-muted-foreground">
                                {url}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
} 