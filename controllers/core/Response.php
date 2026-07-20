<?php

class Response
{
    private $status = 200;
    private $statusExplicito = false;

    public function status(int $code)
    {
        $this->status = $code;
        $this->statusExplicito = true;
        return $this;
    }

    public function toJSON($response = [], $message = "")
    {
        if ($response !== null) {
            $json = $response;
        } else {
            if (!$this->statusExplicito) {
                $this->status = 400;
            }
            $json = $message !== "" ? $message : "No se efectuó la solicitud";
        }

        echo json_encode(
            $json,
            http_response_code($this->status)
        );
    }
}
