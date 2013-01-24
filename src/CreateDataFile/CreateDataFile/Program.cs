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
                    listOfWords.Add(word);
                    count++;
                    if (count%100 == 0)
                        Console.WriteLine("Read {0} words. ({1})", count, word);
                    line = file.ReadLine();
                } while (line != null);

                Console.WriteLine("Writing the result.");
                using (TextWriter writer = new StreamWriter("words.json"))
                {
                    JsonSerializerSettings settings = new JsonSerializerSettings();
                    var json = JsonSerializer.Create(settings);
                    json.Serialize(writer, listOfWords);
                }
                Console.WriteLine("Done!");
                Console.ReadKey();
            }


        }
    }
}
