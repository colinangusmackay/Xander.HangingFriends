using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace CreateDataFile
{
    class Program
    {
        static void Main(string[] args)
        {
            // Data file from : http://wordlist.sourceforge.net/

            int count = 0;
            List<string> listOfWords = new List<string>();
            using (var file = File.OpenText("2of12inf.txt"))
            {
                string line = file.ReadLine();
                do
                {
                    string word = new string(line.Where(char.IsLetter).ToArray());
                    count++;
                    if (count%100 == 0)
                        Console.WriteLine("Read {0} words. ({1})", count, word);
                    if ((word.Length >= 4) && (word.Length<=8))
                        listOfWords.Add(word);
                    line = file.ReadLine();
                } while (line != null);

                Console.WriteLine("Read a total of {0} words. {1} have lengths between 4 and 8.", count, listOfWords.Count);
                Console.WriteLine("Writing the JSON result.");
                using (TextWriter writer = new StreamWriter("words.json"))
                {
                    JsonSerializerSettings settings = new JsonSerializerSettings();
                    var json = JsonSerializer.Create(settings);
                    json.Serialize(writer, listOfWords);
                }
                Console.WriteLine("Writing the TXT result.");
                using (TextWriter writer = new StreamWriter("words.txt"))
                {
                    foreach(var word in listOfWords)
                        writer.WriteLine(word);
                }
                Console.WriteLine("Done!");
                Console.ReadKey();
            }


        }
    }
}
