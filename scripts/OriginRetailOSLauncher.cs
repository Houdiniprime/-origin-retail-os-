using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;

public static class OriginRetailOSLauncher
{
    private static string GetProjectDir()
    {
        return AppDomain.CurrentDomain.BaseDirectory.TrimEnd(Path.DirectorySeparatorChar);
    }

    private static string GetDataDir()
    {
        return Path.Combine(GetProjectDir(), "data");
    }

    private static string GetNpmModules()
    {
        return Path.Combine(GetProjectDir(), "node_modules");
    }

    private static string GetStateFile()
    {
        return Path.Combine(GetDataDir(), "erp-state.json");
    }

    private static string GetInstalledMarker()
    {
        return Path.Combine(GetDataDir(), ".installed");
    }

    private static int Port = 8080;

    public static int Main()
    {
        Console.Title = "Origin Retail OS - Lanceur";
        Console.OutputEncoding = Encoding.UTF8;
        Console.InputEncoding = Encoding.UTF8;

        try
        {
            bool firstRun = !File.Exists(GetInstalledMarker()) || !Directory.Exists(GetNpmModules());

            if (firstRun)
            {
                ShowHeader("PREMIERE INSTALLATION");
                FirstTimeSetup();
            }

            while (true)
            {
                ShowMenu();
                ConsoleKeyInfo key = Console.ReadKey(true);
                Console.WriteLine();

                if (key.Key == ConsoleKey.D1 || key.Key == ConsoleKey.NumPad1 || key.Key == ConsoleKey.Enter)
                {
                    StartServer();
                    OpenBrowser();
                    StartWhatsApp();
                    Console.WriteLine("\nAppuyez sur une touche pour revenir au menu...");
                    Console.ReadKey(true);
                }
                else if (key.Key == ConsoleKey.D2 || key.Key == ConsoleKey.NumPad2)
                {
                    ScanReseau();
                    Console.WriteLine("\nAppuyez sur une touche pour continuer...");
                    Console.ReadKey(true);
                }
                else if (key.Key == ConsoleKey.D3 || key.Key == ConsoleKey.NumPad3)
                {
                    ShowAccessUrls();
                    Console.WriteLine("\nAppuyez sur une touche pour continuer...");
                    Console.ReadKey(true);
                }
                else if (key.Key == ConsoleKey.D4 || key.Key == ConsoleKey.NumPad4)
                {
                    KillProcessOnPort();
                    Console.WriteLine("\nAppuyez sur une touche pour continuer...");
                    Console.ReadKey(true);
                }
                else if (key.Key == ConsoleKey.D5 || key.Key == ConsoleKey.NumPad5)
                {
                    ShowStatus();
                    Console.WriteLine("\nAppuyez sur une touche pour continuer...");
                    Console.ReadKey(true);
                }
                else if (key.Key == ConsoleKey.D6 || key.Key == ConsoleKey.NumPad6)
                {
                    InstallNpmDependencies();
                    Console.WriteLine("\nAppuyez sur une touche pour continuer...");
                    Console.ReadKey(true);
                }
                else if (key.Key == ConsoleKey.D7 || key.Key == ConsoleKey.NumPad7)
                {
                    CreateDesktopShortcut();
                    Console.WriteLine("\nAppuyez sur une touche pour continuer...");
                    Console.ReadKey(true);
                }
                else if (key.Key == ConsoleKey.D8 || key.Key == ConsoleKey.NumPad8)
                {
                    ShowWhatsAppQrInfo();
                    Console.WriteLine("\nAppuyez sur une touche pour continuer...");
                    Console.ReadKey(true);
                }
                else if (key.Key == ConsoleKey.D9 || key.Key == ConsoleKey.NumPad9 || key.Key == ConsoleKey.Q)
                {
                    Console.WriteLine("\nAu revoir !\n");
                    return 0;
                }
                else
                {
                    Console.WriteLine("Option invalide. Appuyez sur 1-9 ou Q.");
                }
            }
        }
        catch (Exception ex)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("\nERREUR: " + ex.Message);
            Console.ResetColor();
            Console.WriteLine("\nAppuyez sur une touche pour fermer.");
            Console.ReadKey(true);
            return 1;
        }
    }

    static void ShowHeader(string title)
    {
        Console.Clear();
        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.WriteLine("================================================");
        Console.WriteLine("    Origin Retail OS - ERP Boutique");
        Console.WriteLine("    Serveur local + WhatsApp + Scan reseau");
        Console.WriteLine("================================================");
        Console.ResetColor();
        Console.WriteLine("  " + title);
        Console.WriteLine("  Dossier: " + GetProjectDir());
        Console.WriteLine("  Node.js: " + (CheckNodeInstalled() ? "OK" : "MANQUANT"));
        Console.WriteLine("  Modules: " + (Directory.Exists(GetNpmModules()) ? "OK" : "MANQUANTS"));
        Console.WriteLine("");
    }

    static void ShowMenu()
    {
        ShowHeader("MENU PRINCIPAL");
        Console.WriteLine("  [1] Demarrer l'ERP + Chrome + WhatsApp");
        Console.WriteLine("  [2] Scanner le reseau (ARP + ping)");
        Console.WriteLine("  [3] Afficher les URLs d'acces");
        Console.WriteLine("  [4] Forcer l'arret du serveur (port " + Port + ")");
        Console.WriteLine("  [5] Etat du systeme");
        Console.WriteLine("  [6] Reinstaller les modules npm");
        Console.WriteLine("  [7] Creer un raccourci Bureau");
        Console.WriteLine("  [8] Info QR code WhatsApp");
        Console.WriteLine("  [9/Q] Quitter");
        Console.WriteLine("");
        Console.Write("  Votre choix [1] ou Entree pour demarrer: ");
    }

    // --- Verifications ------------------------------------------------

    static bool CheckNodeInstalled()
    {
        try
        {
            ProcessStartInfo psi = new ProcessStartInfo("node", "--version");
            psi.RedirectStandardOutput = true;
            psi.RedirectStandardError = true;
            psi.UseShellExecute = false;
            psi.CreateNoWindow = true;
            using (Process p = Process.Start(psi))
            {
                p.WaitForExit(3000);
                return p.ExitCode == 0;
            }
        }
        catch { return false; }
    }

    static bool CheckNpmInstalled()
    {
        try
        {
            ProcessStartInfo psi = new ProcessStartInfo("npm.cmd", "--version");
            psi.RedirectStandardOutput = true;
            psi.RedirectStandardError = true;
            psi.UseShellExecute = false;
            psi.CreateNoWindow = true;
            using (Process p = Process.Start(psi))
            {
                p.WaitForExit(3000);
                return p.ExitCode == 0;
            }
        }
        catch { return false; }
    }

    static bool IsPortInUse(int port)
    {
        try
        {
            TcpClient client = new TcpClient();
            IAsyncResult result = client.BeginConnect("127.0.0.1", port, null, null);
            bool success = result.AsyncWaitHandle.WaitOne(500);
            if (success)
            {
                client.EndConnect(result);
                client.Close();
                return true;
            }
            client.Close();
            return false;
        }
        catch { return false; }
    }

    // --- Installation initiale ----------------------------------------

    static void FirstTimeSetup()
    {
        Console.WriteLine("\nConfiguration initiale...\n");

        if (!CheckNodeInstalled())
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("Node.js n'est pas installe sur ce poste.");
            Console.WriteLine("Veuillez installer Node.js et relancer ce programme.");
            Console.ResetColor();

            try { Process.Start("https://nodejs.org"); } catch { }

            Console.WriteLine("\nAppuyez sur une touche quand Node.js est installe...");
            Console.ReadKey(true);

            if (!CheckNodeInstalled())
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("Node.js toujours pas detecte. Continuez manuellement.");
                Console.ResetColor();
            }
        }

        if (!Directory.Exists(GetNpmModules()))
        {
            InstallNpmDependencies();
        }

        if (!File.Exists(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), "Origin Retail OS.lnk")))
        {
            CreateDesktopShortcut();
        }

        try
        {
            Directory.CreateDirectory(GetDataDir());
            string marker = "Installed: " + DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
            File.WriteAllText(GetInstalledMarker(), marker);
            Console.WriteLine("\nInstallation marquee comme terminee.");
        }
        catch { }

        Console.WriteLine("\nInstallation terminee !");
        Thread.Sleep(1000);
    }

    // --- Installation npm ---------------------------------------------

    static void InstallNpmDependencies()
    {
        Console.WriteLine("\nInstallation des dependances npm...\n");

        ProcessStartInfo psi = new ProcessStartInfo("npm.cmd", "install");
        psi.WorkingDirectory = GetProjectDir();
        psi.UseShellExecute = false;
        psi.RedirectStandardOutput = true;
        psi.RedirectStandardError = true;
        psi.CreateNoWindow = true;

        using (Process p = Process.Start(psi))
        {
            p.OutputDataReceived += (s, e) => { if (!string.IsNullOrEmpty(e.Data)) Console.WriteLine("   " + e.Data); };
            p.ErrorDataReceived += (s, e) => { if (!string.IsNullOrEmpty(e.Data)) Console.WriteLine("   " + e.Data); };
            p.BeginOutputReadLine();
            p.BeginErrorReadLine();
            p.WaitForExit();
        }

        if (Directory.Exists(GetNpmModules()))
        {
            Console.WriteLine("\nDependances installees avec succes.");
        }
        else
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("\nEchec de l'installation des dependances.");
            Console.WriteLine("Verifiez la connexion Internet et reessayez.");
            Console.ResetColor();
        }
    }

    // --- Raccourci bureau ---------------------------------------------

    static void CreateDesktopShortcut()
    {
        Console.WriteLine("\nCreation du raccourci bureau...");

        try
        {
            string desktop = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
            string cmdPath = Path.Combine(desktop, "Origin Retail OS.cmd");
            string exePath = System.Reflection.Assembly.GetExecutingAssembly().Location;

            string content = "@echo off\ncd /d \"" + GetProjectDir() + "\"\nstart \"\" \"" + exePath + "\"\nexit\n";
            File.WriteAllText(cmdPath, content);
            Console.WriteLine("Raccourci cree: " + cmdPath);
        }
        catch (Exception ex)
        {
            Console.WriteLine("Impossible de creer le raccourci: " + ex.Message);
        }
    }

    // --- Demarrer le serveur ------------------------------------------

    static void StartServer()
    {
        if (IsPortInUse(Port))
        {
            Console.WriteLine("\nServeur deja en cours sur le port " + Port + ".");
            return;
        }

        Console.WriteLine("\nDemarrage du serveur sur le port " + Port + "...");

        ProcessStartInfo psi = new ProcessStartInfo("npm.cmd", "start");
        psi.WorkingDirectory = GetProjectDir();
        psi.UseShellExecute = false;
        psi.CreateNoWindow = true;
        psi.RedirectStandardOutput = true;
        psi.RedirectStandardError = true;

        Process process = new Process();
        process.StartInfo = psi;
        process.EnableRaisingEvents = true;
        process.OutputDataReceived += (s, e) =>
        {
            if (!string.IsNullOrEmpty(e.Data))
            {
                Console.WriteLine("   " + e.Data);
            }
        };
        process.ErrorDataReceived += (s, e) =>
        {
            if (!string.IsNullOrEmpty(e.Data))
            {
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine("   " + e.Data);
                Console.ResetColor();
            }
        };

        process.Start();
        process.BeginOutputReadLine();
        process.BeginErrorReadLine();

        for (int i = 0; i < 15; i++)
        {
            Thread.Sleep(1000);
            if (IsPortInUse(Port))
            {
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("\nServeur pret sur http://localhost:" + Port + "/app.html");
                Console.ResetColor();
                return;
            }
        }

        Console.ForegroundColor = ConsoleColor.Yellow;
        Console.WriteLine("\nServeur en cours de demarrage... Verifiez http://localhost:" + Port + "/app.html");
        Console.ResetColor();
    }

    // --- Ouvrir le navigateur -----------------------------------------

    static void OpenBrowser()
    {
        try
        {
            string url = "http://localhost:" + Port + "/app.html";

            string[] chromePaths = new string[] {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Google", "Chrome", "Application", "chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Google", "Chrome", "Application", "chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Google", "Chrome", "Application", "chrome.exe"),
            };

            bool opened = false;
            foreach (string chromePath in chromePaths)
            {
                if (File.Exists(chromePath))
                {
                    Process.Start(chromePath, "--app=" + url + " --no-first-run");
                    opened = true;
                    Console.WriteLine("Chrome ouvert en mode app: " + url);
                    break;
                }
            }

            if (!opened)
            {
                ProcessStartInfo psi = new ProcessStartInfo(url);
                psi.UseShellExecute = true;
                Process.Start(psi);
                Console.WriteLine("Navigateur ouvert: " + url);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("Impossible d'ouvrir le navigateur: " + ex.Message);
            Console.WriteLine("Ouvrez manuellement: http://localhost:" + Port + "/app.html");
        }
    }

    // --- WhatsApp -----------------------------------------------------

    static void StartWhatsApp()
    {
        Console.WriteLine("\nAgent WhatsApp...");

        ProcessStartInfo psi = new ProcessStartInfo("cmd.exe", "/k set WHATSAPP_ENABLED=true && npm.cmd start");
        psi.WorkingDirectory = GetProjectDir();
        psi.UseShellExecute = true;
        psi.WindowStyle = ProcessWindowStyle.Normal;

        try
        {
            Process.Start(psi);
            Console.WriteLine("Agent WhatsApp demarre (fenetre separee)");
            Console.WriteLine("Scannez le QR code dans l'autre fenetre.");
        }
        catch (Exception ex)
        {
            Console.WriteLine("Erreur: " + ex.Message);
            Console.WriteLine("Pour demarrer WhatsApp manuellement:");
            Console.WriteLine("   cd \"" + GetProjectDir() + "\"");
            Console.WriteLine("   set WHATSAPP_ENABLED=true && npm start");
        }
    }

    static void ShowWhatsAppQrInfo()
    {
        Console.WriteLine("\nInstructions QR Code WhatsApp :");
        Console.WriteLine("   1. Ouvrez WhatsApp sur votre telephone");
        Console.WriteLine("   2. Menu > Appareils lies > Lier un appareil");
        Console.WriteLine("   3. Choisissez l'option 1 pour demarrer avec WhatsApp");
        Console.WriteLine("   4. Scannez le QR code dans la fenetre qui s'ouvre");
        Console.WriteLine("");
        Console.WriteLine("Alternative: executez 'demarrer-whatsapp.bat'");
    }

    // --- Scan reseau --------------------------------------------------

    static void ScanReseau()
    {
        Console.WriteLine("\nScan reseau...\n");

        List<string> localIPs = GetLocalIPAddresses();
        if (localIPs.Count == 0)
        {
            Console.WriteLine("Aucune interface reseau active trouvee.");
            return;
        }

        string primaryIP = localIPs[0];
        string[] parts = primaryIP.Split('.');
        string subnet = parts[0] + "." + parts[1] + "." + parts[2];

        Console.WriteLine("   Interface: " + primaryIP);
        Console.WriteLine("   Reseau: " + subnet + ".0/24\n");

        // ARP table
        Console.WriteLine("Table ARP (machines recentes) :");
        List<ArpEntry> arpEntries = GetArpTable();
        Console.WriteLine("   " + "IP".PadRight(18) + "MAC".PadRight(20));
        Console.WriteLine("   " + new string('-', 38));
        foreach (ArpEntry entry in arpEntries)
        {
            string marker = "";
            if (entry.Ip == primaryIP) marker = " <- (Cette machine)";
            Console.WriteLine("   " + entry.Ip.PadRight(18) + entry.Mac.PadRight(20) + marker);
        }

        // Ping sweep
        Console.WriteLine("\nScan actif (ping) :");
        int found = 0;

        for (int i = 1; i <= 254; i++)
        {
            string ip = subnet + "." + i;
            try
            {
                Ping ping = new Ping();
                PingReply reply = ping.Send(ip, 500);
                if (reply.Status == IPStatus.Success)
                {
                    found++;
                    Console.WriteLine("   OK " + ip + " - actif");

                    if (CheckPort(ip, Port))
                    {
                        Console.ForegroundColor = ConsoleColor.Green;
                        Console.WriteLine("      -> ERP dispo sur http://" + ip + ":" + Port + "/app.html");
                        Console.ResetColor();
                    }
                }
                ping.Dispose();
            }
            catch { }
        }

        Console.WriteLine("\n" + arpEntries.Count + " machines (ARP), " + found + " machines actives.");
        ShowAccessUrlsInternal();
    }

    class ArpEntry
    {
        public string Ip { get; set; }
        public string Mac { get; set; }
    }

    static List<ArpEntry> GetArpTable()
    {
        List<ArpEntry> entries = new List<ArpEntry>();
        try
        {
            ProcessStartInfo psi = new ProcessStartInfo("arp", "-a");
            psi.RedirectStandardOutput = true;
            psi.UseShellExecute = false;
            psi.CreateNoWindow = true;
            using (Process p = Process.Start(psi))
            {
                string output = p.StandardOutput.ReadToEnd();
                Regex regex = new Regex(@"(\\d+\\.\\d+\\.\\d+\\.\\d+)\\s+([0-9a-fA-F-]{17})");
                foreach (Match match in regex.Matches(output))
                {
                    ArpEntry entry = new ArpEntry();
                    entry.Ip = match.Groups[1].Value;
                    entry.Mac = match.Groups[2].Value.Replace("-", ":").ToUpper();
                    entries.Add(entry);
                }
            }
        }
        catch { }
        return entries;
    }

    static bool CheckPort(string ip, int port)
    {
        try
        {
            TcpClient client = new TcpClient();
            IAsyncResult result = client.BeginConnect(ip, port, null, null);
            bool success = result.AsyncWaitHandle.WaitOne(300);
            client.Close();
            return success;
        }
        catch { return false; }
    }

    static List<string> GetLocalIPAddresses()
    {
        List<string> ips = new List<string>();
        try
        {
            foreach (NetworkInterface ni in NetworkInterface.GetAllNetworkInterfaces())
            {
                if (ni.OperationalStatus == OperationalStatus.Up)
                {
                    foreach (UnicastIPAddressInformation ip in ni.GetIPProperties().UnicastAddresses)
                    {
                        if (ip.Address.AddressFamily == AddressFamily.InterNetwork &&
                            !IPAddress.IsLoopback(ip.Address))
                        {
                            ips.Add(ip.Address.ToString());
                        }
                    }
                }
            }
        }
        catch { }
        return ips;
    }

    // --- URLs d'acces -------------------------------------------------

    static void ShowAccessUrls()
    {
        Console.WriteLine("\nURLs d'acces a l'ERP :");
        ShowAccessUrlsInternal();
    }

    static void ShowAccessUrlsInternal()
    {
        Console.WriteLine("   Local: http://localhost:" + Port + "/app.html");
        Console.WriteLine("   Local: http://127.0.0.1:" + Port + "/app.html");

        foreach (string ip in GetLocalIPAddresses())
        {
            Console.WriteLine("   Reseau: http://" + ip + ":" + Port + "/app.html");
        }

        Console.WriteLine("\nPour l'acces distant, executez dans un terminal :");
        Console.WriteLine("   cd \"" + GetProjectDir() + "\"");
        Console.WriteLine("   npm run remote");
    }

    // --- Etat du systeme ----------------------------------------------

    static void ShowStatus()
    {
        Console.WriteLine("\nEtat du systeme :\n");

        Console.WriteLine("   Node.js: " + GetNodeVersion());
        Console.WriteLine("   npm: " + (CheckNpmInstalled() ? "OK" : "Manquant"));

        long modulesSize = 0;
        if (Directory.Exists(GetNpmModules()))
        {
            modulesSize = GetDirSize(GetNpmModules()) / 1024 / 1024;
            Console.WriteLine("   Modules: OK (" + modulesSize + " MB)");
        }
        else
        {
            Console.WriteLine("   Modules: Non installes");
        }

        Console.WriteLine("   Serveur: " + (IsPortInUse(Port) ? "En cours" : "Arrete"));
        Console.WriteLine("   Port: " + Port);

        Console.WriteLine("   Projet: " + GetProjectDir());

        FileInfo stateInfo = new FileInfo(GetStateFile());
        Console.WriteLine("   Donnees: " + (stateInfo.Exists ? "OK (" + (stateInfo.Length / 1024) + " KB)" : "Aucune donnee"));

        Console.WriteLine("   Installe: " + (File.Exists(GetInstalledMarker()) ? "Oui" : "Non"));

        try
        {
            long totalSize = GetDirSize(GetProjectDir()) / 1024 / 1024;
            Console.WriteLine("   Taille projet: " + totalSize + " MB");
        }
        catch { }

        Console.WriteLine("\n   Date: " + DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
    }

    static long GetDirSize(string dir)
    {
        long size = 0;
        try
        {
            string[] files = Directory.GetFiles(dir, "*", SearchOption.AllDirectories);
            foreach (string file in files)
            {
                try { size += new FileInfo(file).Length; } catch { }
            }
        }
        catch { }
        return size;
    }

    static string GetNodeVersion()
    {
        try
        {
            ProcessStartInfo psi = new ProcessStartInfo("node", "--version");
            psi.RedirectStandardOutput = true;
            psi.UseShellExecute = false;
            psi.CreateNoWindow = true;
            using (Process p = Process.Start(psi))
            {
                return p.StandardOutput.ReadToEnd().Trim();
            }
        }
        catch { return "inconnu"; }
    }

    // --- Tue le processus sur le port ---------------------------------

    static void KillProcessOnPort()
    {
        Console.WriteLine("\nRecherche du processus sur le port " + Port + "...");

        try
        {
            ProcessStartInfo psi = new ProcessStartInfo("netstat", "-ano");
            psi.RedirectStandardOutput = true;
            psi.UseShellExecute = false;
            psi.CreateNoWindow = true;
            string output;
            using (Process p = Process.Start(psi))
            {
                output = p.StandardOutput.ReadToEnd();
            }

            // Use simple string search instead of complex regex
            string searchStr = "0.0.0.0:" + Port;
            string[] lines = output.Split(new char[] { '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries);
            string pidLine = null;
            foreach (string line in lines)
            {
                if (line.Contains(searchStr) && line.Contains("LISTEN"))
                {
                    pidLine = line;
                    break;
                }
            }

            if (pidLine != null)
            {
                // Extract PID (last number in the line)
                string[] parts = pidLine.Trim().Split(new char[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                string pid = parts[parts.Length - 1];
                Console.WriteLine("   PID trouve: " + pid);

                ProcessStartInfo killPsi = new ProcessStartInfo("taskkill", "/F /PID " + pid);
                killPsi.UseShellExecute = false;
                killPsi.CreateNoWindow = true;
                using (Process killP = Process.Start(killPsi))
                {
                    killP.WaitForExit(3000);
                }
                Console.WriteLine("   Processus tue.");
            }
            else
            {
                Console.WriteLine("   Aucun processus sur le port " + Port + ".");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("   Erreur: " + ex.Message);
        }
    }
}
