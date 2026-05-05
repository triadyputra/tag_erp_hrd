using DevExpress.XtraReports.UI;
using System;
using System.Collections;
using System.ComponentModel;
using System.Drawing;
using tagApiHrd.Model.Dto.report;

namespace tagApi.Report.Hrd
{
    public partial class RefKontrakPwkt : DevExpress.XtraReports.UI.XtraReport
    {
        public RefKontrakPwkt()
        {
            InitializeComponent();
        }

        private void xrPictureBox3_BeforePrint(object sender, CancelEventArgs e)
        {
            var pic = sender as XRPictureBox;

            if (GetCurrentRow() is KontrakReportDto data)
            {
                if (!string.IsNullOrEmpty(data.SIGNATURE_BASE64))
                {
                    try
                    {
                        // 🔥 buang prefix: data:image/png;base64,
                        var base64 = data.SIGNATURE_BASE64;

                        var commaIndex = base64.IndexOf(",");
                        if (commaIndex >= 0)
                            base64 = base64.Substring(commaIndex + 1);

                        var bytes = Convert.FromBase64String(base64);

                        using (var ms = new MemoryStream(bytes))
                        {
                            pic.Image = Image.FromStream(ms);
                        }
                    }
                    catch
                    {
                        pic.Image = null;
                    }
                }
                else
                {
                    pic.Image = null;
                }
            }
        }
    }
}
