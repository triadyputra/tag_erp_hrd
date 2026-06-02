using System.Globalization;

namespace tagApi.Report.Hrd;

/// <summary>
/// Format tanggal pembukaan kontrak: "Pada hari ini, Senin, tanggal sembilan bulan Maret tahun dua ribu dua puluh enam :"
/// </summary>
public static class KontrakPkwtDateTerbilangHelper
{
    private static readonly CultureInfo IdCulture = CultureInfo.GetCultureInfo("id-ID");

    private static readonly string[] Satuan =
    [
        "", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"
    ];

    private static readonly string[] Belasan =
    [
        "sepuluh", "sebelas", "dua belas", "tiga belas", "empat belas", "lima belas",
        "enam belas", "tujuh belas", "delapan belas", "sembilan belas"
    ];

    private static readonly string[] Puluhan =
    [
        "", "", "dua puluh", "tiga puluh", "empat puluh", "lima puluh",
        "enam puluh", "tujuh puluh", "delapan puluh", "sembilan puluh"
    ];

    public static string FormatOpeningParagraph(DateTime? date)
    {
        var d = date ?? DateTime.Today;
        var hari = IdCulture.TextInfo.ToTitleCase(d.ToString("dddd", IdCulture));
        var bulan = d.ToString("MMMM", IdCulture);
        var tanggal = TerbilangHari(d.Day);
        var tahun = TerbilangTahun(d.Year);

        return $"Pada hari ini, {hari}, tanggal {tanggal} bulan {bulan} tahun {tahun} :";
    }

    private static string TerbilangHari(int day)
    {
        if (day is < 1 or > 31)
            return day.ToString(IdCulture);

        if (day < 10)
            return Satuan[day];

        if (day < 20)
            return Belasan[day - 10];

        var puluh = day / 10;
        var sisa = day % 10;
        if (sisa == 0)
            return Puluhan[puluh];

        return $"{Puluhan[puluh]} {Satuan[sisa]}";
    }

    private static string TerbilangTahun(int year)
    {
        if (year is >= 2000 and < 2100)
        {
            var sisa = year % 100;
            if (sisa == 0)
                return "dua ribu";

            return $"dua ribu {TerbilangPuluhan(sisa)}".Trim();
        }

        if (year is >= 1900 and < 2000)
        {
            var sisa = year % 100;
            if (sisa == 0)
                return "seribu sembilan ratus";

            return $"seribu sembilan ratus {TerbilangPuluhan(sisa)}".Trim();
        }

        return TerbilangPuluhan(year);
    }

    private static string TerbilangPuluhan(int n)
    {
        if (n == 0)
            return "";

        if (n < 10)
            return Satuan[n];

        if (n < 20)
            return Belasan[n - 10];

        var puluh = n / 10;
        var sisa = n % 10;
        if (sisa == 0)
            return Puluhan[puluh];

        return $"{Puluhan[puluh]} {Satuan[sisa]}";
    }
}
