import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Writes the weekly update content to the portfolio content directory.
 * @param content The markdown content to write.
 * @param outputPath Path to the output file.
 */
export async function writePortfolioContent(content: string, outputPath: string): Promise<void> {
  try {
    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(outputPath, content, 'utf8');
    console.log(`Successfully wrote weekly update to ${outputPath}`);
  } catch (error: any) {
    console.error('Error writing portfolio content:', error.message);
    throw error;
  }
}
