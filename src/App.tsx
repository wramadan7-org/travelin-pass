import { useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import moment from "moment";
// import { v4 as uuidv4 } from "uuid";

interface InterfaceBookingTicket {
  airline: string;
  flight_number: string;
  code_booking: string;
  first_name: string;
  last_name: string;
  date: Date | null;
  capture?: unknown;
  agree: boolean;
}

const validationSchema = Yup.object().shape({
  airline: Yup.string().required("Maskapai harus diisi"),
  flight_number: Yup.string().required("Nomor penerbangan harus diisi"),
  code_booking: Yup.string().required("Kode pemesanan harus diisi"),
  first_name: Yup.string().required("Nama depan harus diisi"),
  last_name: Yup.string().required("Nama belakang harus diisi"),
  date: Yup.date().required("Tanggal penerbangan harus diisi"),
  agree: Yup.boolean().oneOf(
    [true],
    "Anda harus menyetujui syarat dan ketentuan"
  ),
});

const App = () => {
  const initialBookingTicket = {
    airline: "",
    flight_number: "",
    code_booking: "",
    first_name: "",
    last_name: "",
    date: new Date() || null,
    agree: false,
  };
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [formBookingTicketState, setFormBookingTicketState] =
    useState<InterfaceBookingTicket>(initialBookingTicket);
  const [showCameraState, setShowCameraState] = useState<boolean>(false);
  const [imageDataUrlState, setImageDataUrlState] = useState<string | null>(
    null
  );
  const [fileNameState, setFileNameState] = useState<string>("");
  const [base64ImageState, setBase64ImageState] = useState<string>("");
  const [modalDownloadState, setModalDownloadState] = useState<boolean>(false);
  const [loadingState, setLoadingState] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const base64Type = "data:image/jpeg;base64,";

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
        setImageDataUrlState(imageDataUrl);

        // Menutup kamera
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
        videoRef.current.srcObject = null;
        setShowCameraState(false);
      }
    }
  };

  const generateRandomNumberString = (length: number) => {
    let result = "";
    for (let i = 0; i < length; i++) {
      result += Math.floor(Math.random() * 10);
    }
    return result;
  };

  const handleDownload = () => {
    // Convert base64 string to a Blob object
    const byteCharacters = atob(base64ImageState || "");

    // Create a Uint8Array from the binary string
    const byteArray = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArray[i] = byteCharacters.charCodeAt(i);
    }
    const blob = new Blob([byteArray], { type: "image/jpeg" }); // Adjust the type accordingly

    // Create a temporary URL for the Blob
    const url = URL.createObjectURL(blob);

    // Set random string
    const randomString = generateRandomNumberString(4);

    // Create a temporary anchor element
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${fileNameState}${randomString}.jpg`;

    // Programmatically trigger a click event to start the download
    document.body.appendChild(anchor);
    anchor.click();

    // Cleanup: remove the anchor element and revoke the URL
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setFileNameState("");
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

        <Formik
          initialValues={{
            airline: "",
            flight_number: "",
            code_booking: "",
            from_destination: "",
            to_destination: "",
            first_name: "",
            last_name: "",
            date: new Date(),
            agree: false,
          }}
          validationSchema={validationSchema}
          onSubmit={async (values, actions) => {
            setLoadingState(true);

            const formData = new FormData();
            formData.append(
              "maskapai",
              `${values.airline?.split("-")[1].trim()}`
            );
            formData.append(
              "flight_number",
              `${values?.airline?.split("-")[0]?.trim()}${values.flight_number}`
            );
            formData.append("code_booking", values.code_booking);
            formData.append("asal", values.from_destination);
            formData.append("tujuan", values.to_destination);
            formData.append(
              "exp_date",
              moment(values?.date).format("YYYY-MM-DD HH:mm:ss")
            );
            formData.append(
              "name",
              `${values.first_name.toUpperCase()} ${values.last_name.toUpperCase()}`
            );

            if (imageDataUrlState) {
              const splitBase64 = imageDataUrlState?.split("base64,");
              const base64Image = splitBase64[1];

              formData.append("image_base64", base64Image);
            }

            try {
              const response = await axios.post(
                "https://denso.cudo.co.id/ap2hit",
                formData,
                {
                  headers: {
                    "Content-Type": "multipart/form-data",
                  },
                }
              );
              // alert(JSON.stringify(values, null, 2));
              actions.setSubmitting(false);

              setFileNameState(response?.data?.public_data?.split(" ")[0]);
              setBase64ImageState(response?.data?.qr_base64);
              setModalDownloadState(true);
            } catch (error) {
              console.error("Error sending data: ", error);
            } finally {
              setLoadingState(false);
              setImageDataUrlState("");
              actions.resetForm({
                values: {
                  airline: "",
                  flight_number: "",
                  code_booking: "",
                  from_destination: "",
                  to_destination: "",
                  first_name: "",
                  last_name: "",
                  date: new Date(),
                  agree: false,
                },
              });
            }
          }}
        >
          {(formik) => (
            <Form className="gap-5 flex flex-col">
              {loadingState && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                  <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
                </div>
              )}

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

                {imageDataUrlState && (
                  <div
                    className="flex justify-center mt-10"
                    style={{
                      display: showCameraState ? "none" : "",
                      height: "50%",
                    }}
                  >
                    <img
                      src={imageDataUrlState}
                      className="rounded-md"
                      alt="Captured"
                    />
                  </div>
                )}

                <div className="flex flex-1 w-full h-40 items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{
                      maxWidth: "50%",
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
                  <Field
                    as="select"
                    id="airline"
                    name="airline"
                    className="bg-white flex flex-1 rounded-r-full w-full outline-none focus:outline-none text-sm h-full"
                    onChange={formik.handleChange}
                  >
                    <option className="text-sm" value="">
                      Pilih Maskapai
                    </option>
                    <option className="text-sm" value="GA - Garuda Indonesia">
                      GA - Garuda Indonesia
                    </option>
                    <option className="text-sm" value="QG - Citilink">
                      QG - Citilink
                    </option>
                    <option className="text-sm" value="JT - Lion Air">
                      JT - Lion Air
                    </option>
                    <option className="text-sm" value="ID - Batik Air">
                      ID - Batik Air
                    </option>
                  </Field>
                </div>

                <ErrorMessage
                  name="airline"
                  component="div"
                  className="text-red-500 text-xs"
                />
              </div>

              {/* Nomor Penerbangan */}
              <div className="flex flex-col gap-2">
                <label hidden htmlFor="flight_number">
                  Nomor Penerbangan
                </label>

                <div className="border flex flex-row bg-white rounded-full px-3 h-10 items-center">
                  <span className="border-r pr-2 h-full text-center flex items-center text-sm uppercase">
                    {formik?.values?.airline?.split("-")[0]?.trim()}
                  </span>

                  <Field
                    id="flight_number"
                    name="flight_number"
                    type="text"
                    className="bg-white flex flex-1 rounded-r-full w-full h-full px-2 outline-none focus:outline-none text-sm"
                    placeholder="Nomor Penerbangan"
                    onChange={formik.handleChange}
                  />
                </div>

                <ErrorMessage
                  name="flight_number"
                  component="div"
                  className="text-red-500 text-xs"
                />
              </div>

              {/* Kode Pemesanan */}
              <div className="flex flex-col gap-2">
                <label hidden htmlFor="code_booking">
                  Kode Pemesanan
                </label>

                <Field
                  id="code_booking"
                  name="code_booking"
                  type="text"
                  placeholder="Kode Pemesanan"
                  className="h-10 rounded-full outline-none focus:outline-none px-3 bg-white border text-sm"
                  onChange={formik.handleChange}
                />

                <ErrorMessage
                  name="code_booking"
                  component="div"
                  className="text-red-500 text-xs"
                />
              </div>

              {/* Asal */}
              <div className="flex flex-col gap-2">
                <label hidden htmlFor="from_destination">
                  Asal
                </label>

                <div className="border flex flex-row bg-white rounded-full h-10 px-3 items-center">
                  <Field
                    as="select"
                    id="from_destination"
                    name="from_destination"
                    className="bg-white flex flex-1 rounded-r-full w-full outline-none focus:outline-none text-sm h-full"
                    onChange={formik.handleChange}
                  >
                    <option className="text-sm" value="">
                      Asal Keberangkatan
                    </option>
                    <option value="CGK">
                      Bandara Internasional Soekarno-Hatta, Tangerang, Banten
                    </option>
                    <option value="PLM">
                      Bandar Udara Internasional Sultan Mahmud Badaruddin II,
                      Palembang, Sumatra Selatan
                    </option>
                    <option value="PNK">
                      Bandar Udara Supadio, Pontianak, Kalimantan Barat
                    </option>
                    <option value="KNO">
                      Bandar Udara Internasional Kualanamu, Medan, Sumatra Utara
                    </option>
                    <option value="BTJ">
                      Bandar Udara Internasional Sultan Iskandar Muda, Banda
                      Aceh, Aceh
                    </option>
                    <option value="PDG">
                      Bandar Udara Internasional Minangkabau, Padang, Sumatra
                      Barat
                    </option>
                    <option value="PKU">
                      Bandar Udara Internasional Sultan Syarif Kasim II,
                      Pekanbaru, Riau
                    </option>
                    <option value="BDO">
                      Bandar Udara Husein Sastranegara, Bandung, Jawa Barat
                    </option>
                    <option value="TNJ">
                      Bandar Udara Raja Haji Fisabilillah, Tanjung Pinang,
                      Kepulauan Riau
                    </option>
                    <option value="PGK">
                      Bandar Udara Depati Amir, Pangkal Pinang, Bangka Belitung
                    </option>
                    <option value="DJB">
                      Bandar Udara Sultan Thaha, Jambi
                    </option>
                    <option value="DTB">
                      Bandar Udara Silangit, Siborong-Borong, Sumatra Utara
                    </option>
                    <option value="KJT">
                      Bandar Udara Internasional Kertajati, Majalengka, Jawa
                      Barat
                    </option>
                    <option value="BWX">
                      Bandar Udara Banyuwangi, Banyuwangi, Jawa Timur
                    </option>
                    <option value="PKY">
                      Bandar Udara Tjilik Riwut, Palangka Raya, Kalimantan
                      Tengah
                    </option>
                    <option value="PWL">
                      Bandar Udara Jenderal Besar Sudirman, Purbalingga, Jawa
                      Tengah
                    </option>
                    <option value="TKG">
                      Bandar Udara Radin Inten II, Lampung
                    </option>
                    <option value="BKS">
                      Bandar Udara Fatmawati Soekarno, Bengkulu
                    </option>
                    <option value="TJQ">
                      Bandar Udara H.A.S. Hanandjoeddin, Tanjung Pandan,
                      Bangka-Belitung
                    </option>
                    <option value="NBX">
                      Bandar Udara Nabire, Nabire, Papua Tengah
                    </option>
                    <option value="MOH">
                      Bandar Udara Maleo, Morowali, Sulawesi Tengah
                    </option>
                    <option value="YIA">
                      Bandar Udara Yogyakarta International Airport, Yogyakarta
                    </option>
                    <option value="SUB">
                      Bandar Udara International Juanda, Surabaya
                    </option>
                  </Field>
                </div>

                <ErrorMessage
                  name="from_destination"
                  component="div"
                  className="text-red-500 text-xs"
                />
              </div>

              {/* Tujuan */}
              <div className="flex flex-col gap-2">
                <label hidden htmlFor="to_detination">
                  Tujuan
                </label>

                <div className="border flex flex-row bg-white rounded-full h-10 px-3 items-center">
                  <Field
                    as="select"
                    id="to_destination"
                    name="to_destination"
                    className="bg-white flex flex-1 rounded-r-full w-full outline-none focus:outline-none text-sm h-full"
                    onChange={formik.handleChange}
                  >
                    <option className="text-sm" value="">
                      Tujuan Keberangkatan
                    </option>
                    <option value="SUB">
                      Bandar Udara International Juanda, Surabaya
                    </option>
                    <option value="CGK">
                      Bandara Internasional Soekarno-Hatta, Tangerang, Banten
                    </option>
                    <option value="PLM">
                      Bandar Udara Internasional Sultan Mahmud Badaruddin II,
                      Palembang, Sumatra Selatan
                    </option>
                    <option value="PNK">
                      Bandar Udara Supadio, Pontianak, Kalimantan Barat
                    </option>
                    <option value="KNO">
                      Bandar Udara Internasional Kualanamu, Medan, Sumatra Utara
                    </option>
                    <option value="BTJ">
                      Bandar Udara Internasional Sultan Iskandar Muda, Banda
                      Aceh, Aceh
                    </option>
                    <option value="PDG">
                      Bandar Udara Internasional Minangkabau, Padang, Sumatra
                      Barat
                    </option>
                    <option value="PKU">
                      Bandar Udara Internasional Sultan Syarif Kasim II,
                      Pekanbaru, Riau
                    </option>
                    <option value="BDO">
                      Bandar Udara Husein Sastranegara, Bandung, Jawa Barat
                    </option>
                    <option value="TNJ">
                      Bandar Udara Raja Haji Fisabilillah, Tanjung Pinang,
                      Kepulauan Riau
                    </option>
                    <option value="PGK">
                      Bandar Udara Depati Amir, Pangkal Pinang, Bangka Belitung
                    </option>
                    <option value="DJB">
                      Bandar Udara Sultan Thaha, Jambi
                    </option>
                    <option value="DTB">
                      Bandar Udara Silangit, Siborong-Borong, Sumatra Utara
                    </option>
                    <option value="KJT">
                      Bandar Udara Internasional Kertajati, Majalengka, Jawa
                      Barat
                    </option>
                    <option value="BWX">
                      Bandar Udara Banyuwangi, Banyuwangi, Jawa Timur
                    </option>
                    <option value="PKY">
                      Bandar Udara Tjilik Riwut, Palangka Raya, Kalimantan
                      Tengah
                    </option>
                    <option value="PWL">
                      Bandar Udara Jenderal Besar Sudirman, Purbalingga, Jawa
                      Tengah
                    </option>
                    <option value="TKG">
                      Bandar Udara Radin Inten II, Lampung
                    </option>
                    <option value="BKS">
                      Bandar Udara Fatmawati Soekarno, Bengkulu
                    </option>
                    <option value="TJQ">
                      Bandar Udara H.A.S. Hanandjoeddin, Tanjung Pandan,
                      Bangka-Belitung
                    </option>
                    <option value="NBX">
                      Bandar Udara Nabire, Nabire, Papua Tengah
                    </option>
                    <option value="MOH">
                      Bandar Udara Maleo, Morowali, Sulawesi Tengah
                    </option>
                    <option value="YIA">
                      Bandar Udara Yogyakarta International Airport, Yogyakarta
                    </option>
                  </Field>
                </div>

                <ErrorMessage
                  name="to_destination"
                  component="div"
                  className="text-red-500 text-xs"
                />
              </div>

              {/* Nama Depan */}
              <div className="flex flex-col gap-2">
                <label hidden htmlFor="first_name">
                  Nama Depan
                </label>

                <Field
                  id="first_name"
                  name="first_name"
                  type="text"
                  placeholder="Nama Depan"
                  className="h-10 rounded-full outline-none focus:outline-none px-3 bg-white border uppercase text-xs"
                  onChange={formik.handleChange}
                />

                <ErrorMessage
                  name="first_name"
                  component="div"
                  className="text-red-500 text-xs"
                />
              </div>

              {/* Nama Belakang */}
              <div className="flex flex-col gap-2">
                <label hidden htmlFor="last_name">
                  Nama Belakang
                </label>

                <Field
                  id="last_name"
                  name="last_name"
                  type="text"
                  placeholder="Nama Belakang"
                  className="h-10 rounded-full outline-none focus:outline-none px-3 bg-white border uppercase text-xs"
                  onChange={formik.handleChange}
                />

                <ErrorMessage
                  name="last_name"
                  component="div"
                  className="text-red-500 text-xs"
                />
              </div>

              {/* Tanggal Expired */}
              <div className="flex flex-col">
                <label hidden htmlFor="date">
                  Date
                </label>

                <DatePicker
                  id="date"
                  name="date"
                  selected={formBookingTicketState?.date}
                  onChange={(event) =>
                    setFormBookingTicketState((prevState) => ({
                      ...prevState,
                      date: event,
                    }))
                  }
                  className="h-10 w-full rounded-full outline-none focus:outline-none px-3 bg-white border uppercase text-xs"
                  minDate={new Date()}
                  maxDate={tomorrow}
                />

                <ErrorMessage
                  name="date"
                  component="div"
                  className="text-red-500 text-xs"
                />
              </div>

              {/* Setuju */}
              <div className="flex flex-row gap-2 items-center">
                <Field
                  id="agree"
                  name="agree"
                  type="checkbox"
                  className="checked:text-[#d50f24] text-white"
                  onChange={formik.handleChange}
                />

                <span className="text-xs mb-1 font-semibold">
                  Saya telah membaca dan menyetujui{" "}
                  <span className="text-[#d50f24] font-bold">
                    Syarat dan Ketentuan
                  </span>
                </span>
              </div>

              <ErrorMessage
                name="agree"
                component="div"
                className="text-red-500 text-xs"
              />

              <button
                type="submit"
                className="bg-[#cc1124] text-white text-sm h-10 w-full outline-none hover:bg-[#f2162c] rounded-full hover:outline-none hover:border-none"
              >
                Kirim
              </button>
            </Form>
          )}
        </Formik>
      </div>

      {modalDownloadState && (
        <div
          className="absolute h-full w-full backdrop-blur-sm items-center z-50 rounded-md flex justify-center px-3"
          onClick={() => setModalDownloadState(false)}
        >
          <div className="w-full h-fit bg-gray-300 rounded-md flex flex-col items-center justify-start px-3 py-5 gap-4">
            <img
              src={`${base64Type}${base64ImageState}`}
              className="w-1/3 h-1/2 rounded-md"
              alt="response-image"
            />

            <button
              type="button"
              className="py-2 text-white bg-[#cc1124] hover:bg-[#f2162c] outline-none w-full hover:outline-none hover:border-none focus:outline-none focus:border-none"
              onClick={handleDownload}
            >
              Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
