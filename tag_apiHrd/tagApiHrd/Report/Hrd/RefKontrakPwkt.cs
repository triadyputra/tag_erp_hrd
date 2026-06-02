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
        private XRPictureBox? _xrPictureBoxHrd;

        public RefKontrakPwkt()
        {
            InitializeComponent();
            xrTableCell2.BeforePrint += xrTableCell2_BeforePrint;
            xrPictureBox1.BeforePrint += xrPictureBox1_BeforePrint;
            xrPictureBox2.BeforePrint += xrPictureBox2_BeforePrint;

            _xrPictureBoxHrd = new XRPictureBox
            {
                Name = "xrPictureBoxHrd",
                LocationFloat = new DevExpress.Utils.PointFloat(57.07321F, 0.0004882813F),
                SizeF = new System.Drawing.SizeF(223.9583F, 100F),
                Sizing = DevExpress.XtraPrinting.ImageSizeMode.ZoomImage
            };
            _xrPictureBoxHrd.BeforePrint += xrPictureBoxHrd_BeforePrint;
            xrTableCell386.Controls.Add(_xrPictureBoxHrd);
        }

        private void xrPictureBox1_BeforePrint(object sender, CancelEventArgs e)
        {
            var pic = sender as XRPictureBox;
            if (pic == null || GetCurrentRow() is not KontrakReportDto data)
                return;

            pic.Image = DecodeSignatureImage(data.LOGO_BASE64);
        }

        private void xrPictureBox2_BeforePrint(object sender, CancelEventArgs e)
        {
            var pic = sender as XRPictureBox;
            if (pic == null || GetCurrentRow() is not KontrakReportDto data)
                return;

            if (KontrakPkwtLogoHelper.IsErdewe(data.NmPerusahaan))
            {
                pic.Visible = false;
                pic.Image = null;
            }
            else
            {
                pic.Visible = true;
                //pic.Image = DecodeSignatureImage(data.LOGO_BASE64);
            }
        }

        private void xrTableCell2_BeforePrint(object sender, CancelEventArgs e)
        {
            if (sender is not XRTableCell cell || GetCurrentRow() is not KontrakReportDto data)
                return;

            cell.Text = KontrakPkwtDateTerbilangHelper.FormatOpeningParagraph(data.TglMulai);
        }

        private void xrPictureBox3_BeforePrint(object sender, CancelEventArgs e)
        {
            var pic = sender as XRPictureBox;
            if (pic == null || GetCurrentRow() is not KontrakReportDto data)
                return;

            pic.Image = DecodeSignatureImage(data.SIGNATURE_BASE64);
        }

        private void xrPictureBoxHrd_BeforePrint(object sender, CancelEventArgs e)
        {
            var pic = sender as XRPictureBox;
            if (pic == null || GetCurrentRow() is not KontrakReportDto data)
                return;

            if (data.StatusTtd == 2 && !string.IsNullOrEmpty(data.HRD_SIGNATURE_BASE64))
                pic.Image = DecodeSignatureImage(data.HRD_SIGNATURE_BASE64);
            else
                pic.Image = null;
        }

        private static Image? DecodeSignatureImage(string? base64Input)
        {
            if (string.IsNullOrWhiteSpace(base64Input))
                return null;

            try
            {
                var base64 = base64Input;
                var commaIndex = base64.IndexOf(',');
                if (commaIndex >= 0)
                    base64 = base64[(commaIndex + 1)..];

                var bytes = Convert.FromBase64String(base64);
                using var ms = new MemoryStream(bytes);
                return Image.FromStream(ms);
            }
            catch
            {
                return null;
            }
        }
    }
}
