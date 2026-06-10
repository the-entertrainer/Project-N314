export interface PreloaderQuote {
  text: string;
  author: string;
}

export const PRELOADER_QUOTES: PreloaderQuote[] = [
  { text: 'The stock market is a device for transferring money from the impatient to the patient.', author: 'Warren Buffett' },
  { text: 'In the short run, the market is a voting machine. In the long run, it is a weighing machine.', author: 'Benjamin Graham' },
  { text: 'Know what you own, and know why you own it.', author: 'Peter Lynch' },
  { text: 'The four most dangerous words in investing are: this time it\'s different.', author: 'Sir John Templeton' },
  { text: 'Risk comes from not knowing what you\'re doing.', author: 'Warren Buffett' },
  { text: 'Time in the market beats timing the market.', author: 'Ken Fisher' },
  { text: 'The market can remain irrational longer than you can remain solvent.', author: 'John Maynard Keynes' },
  { text: 'Wide diversification is only required when investors do not understand what they are doing.', author: 'Warren Buffett' },
  { text: 'Be fearful when others are greedy, and greedy when others are fearful.', author: 'Warren Buffett' },
  { text: 'An investment in knowledge pays the best interest.', author: 'Benjamin Franklin' },
  { text: 'The individual investor should act consistently as an investor and not as a speculator.', author: 'Benjamin Graham' },
  { text: 'It\'s not whether you\'re right or wrong that\'s important, but how much you make when you\'re right.', author: 'George Soros' },
  { text: 'The goal of a successful trader is to make the best trades. Money is secondary.', author: 'Alexander Elder' },
  { text: 'Markets are constantly in a state of uncertainty and flux. Money is made by discounting the obvious and betting on the unexpected.', author: 'George Soros' },
  { text: 'Compound interest is the eighth wonder of the world.', author: 'Albert Einstein' },
  { text: 'Price is what you pay. Value is what you get.', author: 'Warren Buffett' },
  { text: 'The stock market is filled with individuals who know the price of everything, but the value of nothing.', author: 'Philip Fisher' },
  { text: 'Invest for the long haul. Don\'t get too greedy and don\'t get too scared.', author: 'Shelby M.C. Davis' },
  { text: 'Behind every stock is a company. Find out what it\'s doing.', author: 'Peter Lynch' },
  { text: 'The essence of investment management is the management of risks, not the management of returns.', author: 'Benjamin Graham' },
  { text: 'Opportunities come infrequently. When it rains gold, put out the bucket, not the thimble.', author: 'Warren Buffett' },
  { text: 'The market is a pendulum that forever swings between unsustainable optimism and unjustified pessimism.', author: 'Benjamin Graham' },
  { text: 'Do not save what is left after spending, but spend what is left after saving.', author: 'Warren Buffett' },
  { text: 'Successful investing is about managing risk, not avoiding it.', author: 'Benjamin Graham' },
  { text: 'The big money is not in the buying or selling, but in the waiting.', author: 'Charlie Munger' },
  { text: 'Every once in a while, the market does something so stupid it takes your breath away.', author: 'Jim Cramer' },
  { text: 'Investing should be more like watching paint dry or watching grass grow.', author: 'Paul Samuelson' },
  { text: 'The best investment you can make is in yourself.', author: 'Warren Buffett' },
  { text: 'Bull markets are born on pessimism, grow on skepticism, mature on optimism, and die on euphoria.', author: 'Sir John Templeton' },
  { text: 'Patience is bitter, but its fruit is sweet.', author: 'Jean-Jacques Rousseau' },
];

export function getRandomQuote(): PreloaderQuote {
  const index = Math.floor(Math.random() * PRELOADER_QUOTES.length);
  return PRELOADER_QUOTES[index];
}