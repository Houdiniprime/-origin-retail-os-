using System;
using System.Diagnostics;
using System.IO;

public static class ClientInstallerLauncher
{
    public static int Main()
    {
        var projectDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd(Path.DirectorySeparatorChar);
        var script = Path.Combine(projectDir, "scripts", "install-client.ps1");
        Console.Title = "Installation Origin Retail OS";
        Console.WriteLine("Origin Retail OS - Installation client");
        Console.WriteLine("Dossier: " + projectDir);
        Console.WriteLine();

        if (!File.Exists(script))
        {
            Console.WriteLine("Script introuvable: " + script);
            Console.WriteLine("Appuyer sur une touche pour fermer.");
            Console.ReadKey(true);
            return 1;
        }

        var psi = new ProcessStartInfo("powershell.exe")
        {
            WorkingDirectory = projectDir,
            UseShellExecute = false
        };
        psi.Arguments = "-NoProfile -ExecutionPolicy Bypass -File \"" + script + "\"";

        try
        {
            using (var process = Process.Start(psi))
            {
                process.WaitForExit();
                Console.WriteLine();
                Console.WriteLine("Installation terminee. Appuyer sur une touche pour fermer.");
                Console.ReadKey(true);
                return process.ExitCode;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("Erreur installation: " + ex.Message);
            Console.WriteLine("Appuyer sur une touche pour fermer.");
            Console.ReadKey(true);
            return 1;
        }
    }
}
