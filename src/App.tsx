import { ChangeEvent, FormEvent, useRef, useState } from "react";

interface InterfaceBookingTicket {
  airline: string;
  flight_number: string;
  code_booking: string;
  first_name: string;
  last_name: string;
  capture?: unknown;
  agree: boolean;
}

const App = () => {
  const initialBookingTicket = {
    airline: "",
    flight_number: "",
    code_booking: "",
    first_name: "",
    last_name: "",
    agree: false,
  };

  const [formBookingTicketState, setFormBookingTicketState] =
    useState<InterfaceBookingTicket>(initialBookingTicket);
  const [showCameraState, setShowCameraState] = useState<boolean>(false);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleOpenCamera = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then(function (stream) {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setShowCameraState(true);
          }
        })
        .catch(function (error) {
          console.error("Error accessing camera: ", error);
        });
    }
  };

  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(
          videoRef.current,
          0,
          0,
          videoRef.current.videoWidth,
          videoRef.current.videoHeight
        );
        const imageDataUrl = canvas.toDataURL("image/png");
        setImageDataUrl(imageDataUrl);

        // Menutup kamera
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
        videoRef.current.srcObject = null;
        setShowCameraState(false);
      }
    }
  };

  const handleChangeFormBookingTicket = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setFormBookingTicketState((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleChangeFormBookingTicketChecked = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setFormBookingTicketState((prevState) => ({
      ...prevState,
      agree: event?.target?.checked,
    }));
  };

  const handleSubmitFormBookingTicket = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = {
      ...formBookingTicketState,
      capture: imageDataUrl,
    };
    console.log("SUBMIT: ", data);
  };

  return (
    <div className="flex flex-1 flex-col w-[100vw] h-[100vh] items-center justify-start bg-white overflow-y-scroll pb-5">
      <div className="max-h-[50px] w-full bg-[#be0c18] text-white font-bold text-lg text-center py-2">
        TravelinPass
      </div>

      {/* Content/Form */}
      <div className="flex flex-col gap-3 text-black w-full px-5">
        <span className="font-bold text-xl text-center my-5">
          Tambahkan Penerbangan Saya
        </span>

        <form
          className="gap-5 flex flex-col"
          onSubmit={handleSubmitFormBookingTicket}
        >
          <div className="flex flex-col gap-2">
            <label hidden htmlFor="capture">
              Capture
            </label>

            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={handleOpenCamera}
                className="bg-[#cc1124] text-white text-sm h-10 w-full outline-none hover:bg-[#f2162c] rounded-full hover:outline-none hover:border-none"
              >
                Buka Kamera
              </button>

              <button
                type="button"
                onClick={handleCapture}
                className="bg-[#cc1124] text-white text-sm h-10 w-full outline-none hover:bg-[#f2162c] rounded-full hover:outline-none hover:border-none"
              >
                Ambil Foto
              </button>
            </div>

            {imageDataUrl && (
              <div
                className="flex max-h-56 justify-center"
                style={{ display: showCameraState ? "none" : "" }}
              >
                <img src={imageDataUrl} className="rounded-md" alt="Captured" />
              </div>
            )}

            <div className="flex flex-1 w-full h-40 items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                  maxWidth: "30%",
                  width: "100%",
                  display: showCameraState ? "" : "none",
                }}
              />
            </div>
          </div>

          {/* Maskapai */}
          <div className="flex flex-col gap-2">
            <label hidden htmlFor="airline">
              Maskapai
            </label>

            <div className="border flex flex-row bg-white rounded-full h-10 px-3 items-center">
              <span className="text-sm uppercase">ID -</span>

              <select
                id="airline"
                name="airline"
                className="bg-white flex flex-1 rounded-r-full w-full outline-none focus:outline-none text-sm "
                value={formBookingTicketState?.airline}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  handleChangeFormBookingTicket(event)
                }
              >
                <option className="text-sm" value="">
                  Pilih Maskapai
                </option>
                <option className="text-sm" value="Garuda Indonesia">
                  Garuda Indonesia
                </option>
                <option className="text-sm" value="Citilink">
                  Citilink
                </option>
                <option className="text-sm" value="Lion Air">
                  Lion Air
                </option>
                <option className="text-sm" value="Batik Air">
                  Batik Air
                </option>
              </select>
            </div>
          </div>

          {/* Nomor Penerbangan */}
          <div className="flex flex-col gap-2">
            <label hidden htmlFor="flight_number">
              Nomor Penerbangan
            </label>

            <div className="border flex flex-row bg-white rounded-full px-3 h-10 items-center">
              <span className="border-r pr-2 h-full text-center flex items-center text-sm uppercase">
                ID
              </span>

              <input
                id="flight_number"
                name="flight_number"
                type="text"
                className="bg-white flex flex-1 rounded-r-full w-full px-2 outline-none focus:outline-none text-sm"
                placeholder="Nomor Penerbangan"
                value={formBookingTicketState?.flight_number}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  handleChangeFormBookingTicket(event)
                }
              />
            </div>
          </div>

          {/* Kode Pemesanan */}
          <div className="flex flex-col gap-2">
            <label hidden htmlFor="code_booking">
              Kode Pemesanan
            </label>

            <input
              id="code_booking"
              name="code_booking"
              type="text"
              placeholder="Kode Pemesanan"
              className="h-10 rounded-full outline-none focus:outline-none px-3 bg-white border text-sm"
              value={formBookingTicketState?.code_booking}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                handleChangeFormBookingTicket(event)
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <label hidden htmlFor="first_name">
              Nama Depan
            </label>

            <input
              id="first_name"
              name="first_name"
              type="text"
              placeholder="Nama Depan"
              className="h-10 rounded-full outline-none focus:outline-none px-3 bg-white border uppercase text-xs"
              value={formBookingTicketState?.first_name}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                handleChangeFormBookingTicket(event)
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <label hidden htmlFor="last_name">
              Nama Depan
            </label>

            <input
              id="last_name"
              name="last_name"
              type="text"
              placeholder="Nama Belakang"
              className="h-10 rounded-full outline-none focus:outline-none px-3 bg-white border uppercase text-xs"
              value={formBookingTicketState?.last_name}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                handleChangeFormBookingTicket(event)
              }
            />
          </div>

          <div className="flex flex-row gap-2 items-center">
            <input
              id="agree"
              name="agree"
              type="checkbox"
              className="checked:text-[#d50f24] text-white"
              checked={formBookingTicketState?.agree}
              onChange={handleChangeFormBookingTicketChecked}
            />

            <span className="text-xs mb-1 font-semibold">
              Saya telah membaca dan menyetujui{" "}
              <span className="text-[#d50f24] font-bold">
                Syarat dan Ketentuan
              </span>
            </span>
          </div>

          <button
            type="submit"
            className="bg-[#cc1124] text-white text-sm h-10 w-full outline-none hover:bg-[#f2162c] rounded-full hover:outline-none hover:border-none"
          >
            Kirim
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;
