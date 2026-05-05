import { Dialog, DialogContent, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

type Props = {
  open: boolean;
  onClose: () => void;
  image?: string;
};

export default function ImagePreviewDialog({
  open,
  onClose,
  image,
}: Props) {
  if (!image) return null;

  return (
    
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        sx={{
          backdropFilter: "blur(6px)",
        }}
      >
      <DialogContent
        sx={{
          p: 0,
          position: "relative",
          backgroundColor: "#000",
        }}
      >
        {/* CLOSE BUTTON */}
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            color: "#fff",
            zIndex: 1,
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* IMAGE */}
        <img
          src={image}
          alt="Preview"
          style={{
            width: "100%",
            height: "auto",
            maxHeight: "80vh",
            objectFit: "contain",
            display: "block",
          }}
        />
      </DialogContent>
    </Dialog>
  );
}